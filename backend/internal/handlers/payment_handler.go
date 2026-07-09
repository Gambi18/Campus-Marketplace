package handlers

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/platform/dbtx"
	"campus-marketplace/internal/platform/httpx"
	"campus-marketplace/internal/services"
	"campus-marketplace/internal/ws"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type PaymentHandler struct {
	db             *sql.DB
	queries        *db.Queries
	campayService  *services.CamPayService
	receiptService *services.ReceiptService
	cloudinary     *services.CloudinaryService
	hub            *ws.Hub
}

func NewPaymentHandler(
	sqlDB *sql.DB,
	queries *db.Queries,
	campayService *services.CamPayService,
	receiptService *services.ReceiptService,
	cloudinary *services.CloudinaryService,
	hub *ws.Hub,
) *PaymentHandler {
	return &PaymentHandler{
		db:             sqlDB,
		queries:        queries,
		campayService:  campayService,
		receiptService: receiptService,
		cloudinary:     cloudinary,
		hub:            hub,
	}
}

func (h *PaymentHandler) InitiatePayment(c *gin.Context) {
	// 1. Get buyer ID from JWT
	buyerID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	// 2. Parse request
	var req models.InitiatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	// 2b. Validate phone number (CamPay expects country-coded MSISDN, e.g. 237XXXXXXXXX)
	if len(req.PhoneNumber) < 9 {
		httpx.Error(c, http.StatusBadRequest, "phone_number must be at least 9 digits")
		return
	}

	// 3. Get product (needed for price/seller/title)
	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	product, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "product not found")
		return
	}

	// 4. Validate product is available
	if product.Status != "available" {
		httpx.Error(c, http.StatusBadRequest, "product is not available for purchase")
		return
	}

	// 5. Prevent buyer from buying their own product
	if product.SellerID == buyerID {
		httpx.Error(c, http.StatusBadRequest, "you cannot buy your own product")
		return
	}

	// 6. Atomically claim the product: available -> in_escrow. This is the
	// race-safe replacement for the old read-then-write, so two concurrent
	// buyers cannot both proceed. The loser gets sql.ErrNoRows -> 409.
	if _, err := h.queries.ClaimProductForPurchase(c.Request.Context(), productID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			httpx.Error(c, http.StatusConflict, "product is no longer available")
			return
		}
		httpx.Error(c, http.StatusInternalServerError, "could not reserve product")
		return
	}

	// 7. Collect payment (skip CamPay in dev bypass mode). From here on, any
	// failure MUST revert the product to 'available' so the item isn't stuck.
	var reference string
	var operator string

	if devBypassEnabled() {
		reference = "dev-bypass-" + uuid.New().String()
		operator = detectOperator(req.PhoneNumber)
	} else {
		collectResp, err := h.campayService.CollectPayment(
			product.Price,
			req.PhoneNumber,
			fmt.Sprintf("Payment for %s on Campus Marketplace", product.Title),
			productID.String(),
		)
		if err != nil {
			h.revertProductToAvailable(c.Request.Context(), productID, product.SellerID)
			httpx.Error(c, http.StatusBadRequest, err.Error())
			return
		}
		reference = collectResp.Reference
		operator = collectResp.Operator
		if operator == "" {
			operator = detectOperator(req.PhoneNumber)
		}
	}

	// 8. Save payment to DB. The UNIQUE partial index (one live payment per
	// product) is a backstop: a unique violation means another buyer already
	// has a live payment, so treat it as 409 and revert.
	payment, err := h.queries.CreatePayment(c.Request.Context(), db.CreatePaymentParams{
		BuyerID:     buyerID,
		SellerID:    product.SellerID,
		ProductID:   productID,
		Amount:      product.Price,
		PhoneNumber: req.PhoneNumber,
		Operator:    operator,
		Reference:   sql.NullString{String: reference, Valid: reference != ""},
	})
	if err != nil {
		h.revertProductToAvailable(c.Request.Context(), productID, product.SellerID)
		if isUniqueViolation(err) {
			httpx.Error(c, http.StatusConflict, "product is no longer available")
			return
		}
		httpx.Error(c, http.StatusInternalServerError, "could not save payment")
		return
	}

	// In dev bypass mode, auto-confirm the payment to "held" status.
	if devBypassEnabled() {
		if _, err := h.queries.UpdatePaymentToHeld(c.Request.Context(),
			sql.NullString{String: reference, Valid: true},
		); err != nil && !errors.Is(err, sql.ErrNoRows) {
			log.Printf("dev-bypass: error updating payment to held: %v", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "payment initiated successfully, please confirm on your phone",
		"reference": reference,
		"payment":   models.ToBasicPaymentResponse(payment),
	})
}

func (h *PaymentHandler) Webhook(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	reference, _ := payload["reference"].(string)

	if reference == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing reference"})
		return
	}

	// SECURITY: this endpoint is public, so the payload's `status` field cannot be
	// trusted — anyone could POST a forged "SUCCESSFUL" webhook. Re-query CamPay for
	// the authoritative status using the reference before moving money into escrow.
	txStatus, err := h.campayService.GetTransactionStatus(reference)
	if err != nil {
		log.Printf("webhook: could not verify transaction %s with CamPay: %v", reference, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "could not verify transaction"})
		return
	}

	if txStatus.Status == "SUCCESSFUL" {
		if _, err := h.queries.UpdatePaymentToHeld(c.Request.Context(),
			sql.NullString{String: reference, Valid: true},
		); err != nil {
			// ErrNoRows means the payment isn't pending — already processed by a
			// prior webhook/status-check. Idempotent no-op: still return 200.
			if !errors.Is(err, sql.ErrNoRows) {
				log.Printf("webhook: error updating payment to held: %v", err)
			}
		} else {
			log.Printf("Payment %s confirmed and held in escrow", reference)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "webhook received"})
}

func (h *PaymentHandler) CheckPaymentStatus(c *gin.Context) {
	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	payment, err := h.queries.GetPaymentByID(c.Request.Context(), paymentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	// Only the buyer or seller may inspect a payment's details.
	if !requirePaymentParty(c, payment.BuyerID, payment.SellerID) {
		return
	}

	if !payment.Reference.Valid || payment.Reference.String == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment has no CamPay reference yet"})
		return
	}

	// Dev bypass: use local DB status instead of calling CamPay
	if devBypassEnabled() && strings.HasPrefix(payment.Reference.String, "dev-bypass-") {
		c.JSON(http.StatusOK, gin.H{
			"payment_id": payment.ID.String(),
			"reference":  payment.Reference.String,
			"status":     "SUCCESSFUL",
			"amount":     payment.Amount,
			"operator":   payment.Operator,
		})
		return
	}

	status, err := h.campayService.GetTransactionStatus(payment.Reference.String)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not check payment status"})
		return
	}

	// If SUCCESSFUL and still pending — update to held. ErrNoRows means the
	// row was concurrently advanced (already processed); benign no-op.
	if status.Status == "SUCCESSFUL" && payment.Status == "pending" {
		if _, err := h.queries.UpdatePaymentToHeld(c.Request.Context(),
			sql.NullString{String: payment.Reference.String, Valid: true},
		); err != nil && !errors.Is(err, sql.ErrNoRows) {
			log.Printf("error updating payment to held: %v", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"payment_id": payment.ID.String(),
		"reference":  payment.Reference.String,
		"status":     status.Status,
		"amount":     status.Amount,
		"operator":   status.Operator,
	})
}

func (h *PaymentHandler) ConfirmDelivery(c *gin.Context) {
	buyerID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	var reqBody struct {
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&reqBody); err != nil {
		// body is optional — swallow bind errors so existing callers without a body still work
		reqBody.Reason = ""
	}

	payment, err := h.queries.GetPaymentByID(c.Request.Context(), paymentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	// Verify buyer owns this payment
	if payment.BuyerID != buyerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not the buyer of this payment"})
		return
	}

	// Verify payment is in held status
	if payment.Status != "held" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment is not in escrow"})
		return
	}

	// Atomically claim the payment so two concurrent confirmations cannot both
	// trigger a withdrawal (double-spend). Only one caller transitions held -> releasing.
	if _, err := h.queries.ClaimPaymentForRelease(c.Request.Context(), db.ClaimPaymentForReleaseParams{
		ID:     payment.ID,
		Status: "releasing",
	}); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusConflict, gin.H{"error": "payment is already being processed"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not lock payment"})
		return
	}

	//  fetch product
	product, err := h.queries.GetProductByID(c.Request.Context(), payment.ProductID)
	if err != nil {
		log.Printf("error fetching product details: %v", err)
	}

	// Calculate fees - 3% on sale (XAF has no minor units, so fees are whole numbers)
	amount, err := strconv.ParseFloat(payment.Amount, 64)
	if err != nil {
		_, _ = h.queries.RevertPaymentToHeld(c.Request.Context(), payment.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid payment amount"})
		return
	}
	platformFee := computePlatformFee(amount, 0.03)
	netAmount := amount - platformFee

	// Get seller phone number
	seller, err := h.queries.GetUserByID(c.Request.Context(), payment.SellerID)
	if err != nil {
		_, _ = h.queries.RevertPaymentToHeld(c.Request.Context(), payment.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not get seller details"})
		return
	}

	// Withdraw to seller
	withdrawResp, err := h.campayService.Withdraw(
		fmt.Sprintf("%.0f", netAmount),
		seller.PhoneNumber,
		fmt.Sprintf("Payment for %s - Campus Marketplace", payment.ProductTitle),
		payment.ID.String(),
	)
	if err != nil {
		// Withdrawal failed — release the claim so the buyer can retry.
		_, _ = h.queries.RevertPaymentToHeld(c.Request.Context(), payment.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not release payment to seller"})
		return
	}

	receiptNumber := fmt.Sprintf("CM-%d-%06d", time.Now().Year(), time.Now().UnixNano()%1000000)

	// Generate PDF receipt
	receiptURL, err := h.receiptService.GenerateAndUpload(c.Request.Context(), services.ReceiptData{
		ReceiptNumber: receiptNumber,
		Date:          time.Now(),
		BuyerName:     payment.BuyerName,
		SellerName:    payment.SellerName,
		ProductTitle:  payment.ProductTitle,
		CategoryName:  product.CategoryName,
		Condition:     product.Condition,
		Amount:        payment.Amount,
		PlatformFee:   fmt.Sprintf("%.2f", platformFee),
		NetAmount:     fmt.Sprintf("%.2f", netAmount),
		PhoneNumber:   payment.PhoneNumber,
		Operator:      payment.Operator,
		Reference:     payment.Reference.String,
		Status:        "PAYMENT SUCCESSFUL",
	})
	if err != nil {
		log.Printf("error generating receipt: %v", err)
		receiptURL = ""
	}

	// Atomically commit the two post-withdrawal writes together, closing the
	// crash-window where money left CamPay but the payment stayed 'releasing'.
	// If this tx fails the payment stays 'releasing' and is surfaced by the
	// stuck-payment reconciler for operator follow-up.
	var updated db.Payment
	err = dbtx.RunInTx(c.Request.Context(), h.db, h.queries, func(qtx *db.Queries) error {
		u, err := qtx.UpdatePaymentAfterRelease(c.Request.Context(), db.UpdatePaymentAfterReleaseParams{
			ID:                payment.ID,
			Status:            "released",
			PlatformFee:       fmt.Sprintf("%.2f", platformFee),
			NetAmount:         fmt.Sprintf("%.2f", netAmount),
			WithdrawReference: sql.NullString{String: withdrawResp.Reference, Valid: true},
			ReceiptNumber:     sql.NullString{String: receiptNumber, Valid: true},
			ReceiptPdfUrl:     sql.NullString{String: receiptURL, Valid: receiptURL != ""},
			RejectionReason:   sql.NullString{},
		})
		if err != nil {
			return err
		}
		updated = u
		_, err = qtx.UpdateProductStatus(c.Request.Context(), db.UpdateProductStatusParams{
			ID:       payment.ProductID,
			SellerID: payment.SellerID,
			Status:   "sold",
		})
		return err
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update payment record"})
		return
	}

	// Notify seller via WebSocket
	h.hub.Broadcast <- ws.Message{
		SenderID:   buyerID.String(),
		ReceiverID: payment.SellerID.String(),
		Content:    fmt.Sprintf("Your item '%s' has been confirmed and payment of %.2f XAF has been sent to your account!", payment.ProductTitle, netAmount),
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "delivery confirmed, payment released to seller",
		"receipt_number": receiptNumber,
		"receipt_url":    receiptURL,
		"payment":        models.ToPaymentResponse(updated),
	})
}

func (h *PaymentHandler) RejectDelivery(c *gin.Context) {
	buyerID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	var reqBody struct {
		Reason string `json:"reason"`
	}
	if err = c.ShouldBindJSON(&reqBody); err != nil {
		reqBody.Reason = ""
	}

	payment, err := h.queries.GetPaymentByID(c.Request.Context(), paymentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	product, err := h.queries.GetProductByID(c.Request.Context(), payment.ProductID)
	if err != nil {
		log.Printf("error fetching product details: %v", err)
	}

	// Verify buyer owns this payment
	if payment.BuyerID != buyerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not the buyer of this payment"})
		return
	}

	// Verify payment is held
	if payment.Status != "held" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment is not in escrow"})
		return
	}

	// Atomically claim the payment so concurrent reject/confirm requests cannot
	// both move money. Only one caller transitions held -> refunding.
	if _, err := h.queries.ClaimPaymentForRelease(c.Request.Context(), db.ClaimPaymentForReleaseParams{
		ID:     payment.ID,
		Status: "refunding",
	}); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusConflict, gin.H{"error": "payment is already being processed"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not lock payment"})
		return
	}

	// Calculate fees - 1% on refund (XAF has no minor units)
	amount, err := strconv.ParseFloat(payment.Amount, 64)
	if err != nil {
		_, _ = h.queries.RevertPaymentToHeld(c.Request.Context(), payment.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid payment amount"})
		return
	}
	platformFee := computePlatformFee(amount, 0.01)
	netAmount := amount - platformFee

	// Refund to buyer's payment phone number
	withdrawResp, err := h.campayService.Withdraw(
		fmt.Sprintf("%.0f", netAmount),
		payment.PhoneNumber,
		fmt.Sprintf("Refund for %s - Campus Marketplace", payment.ProductTitle),
		payment.ID.String(),
	)
	if err != nil {
		// Refund failed — release the claim so it can be retried.
		_, _ = h.queries.RevertPaymentToHeld(c.Request.Context(), payment.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process refund"})
		return
	}

	receiptNumber := fmt.Sprintf("CM-REF-%d-%06d", time.Now().Year(), time.Now().UnixNano()%1000000)

	// Generate PDF receipt
	receiptURL, err := h.receiptService.GenerateAndUpload(c.Request.Context(), services.ReceiptData{
		ReceiptNumber: receiptNumber,
		Date:          time.Now(),
		BuyerName:     payment.BuyerName,
		SellerName:    payment.SellerName,
		ProductTitle:  payment.ProductTitle,
		CategoryName:  product.CategoryName,
		Condition:     product.Condition,
		Amount:        payment.Amount,
		PlatformFee:   fmt.Sprintf("%.2f", platformFee),
		NetAmount:     fmt.Sprintf("%.2f", netAmount),
		PhoneNumber:   payment.PhoneNumber,
		Operator:      payment.Operator,
		Reference:     payment.Reference.String,
		Status:        "PAYMENT REFUNDED",
	})
	if err != nil {
		log.Printf("error generating receipt: %v", err)
		receiptURL = ""
	}

	// Atomically commit the two post-refund writes together, closing the
	// crash-window where money left CamPay but the payment stayed 'refunding'.
	// If this tx fails the payment stays 'refunding' and is surfaced by the
	// stuck-payment reconciler for operator follow-up.
	var updated db.Payment
	err = dbtx.RunInTx(c.Request.Context(), h.db, h.queries, func(qtx *db.Queries) error {
		u, err := qtx.UpdatePaymentAfterRelease(c.Request.Context(), db.UpdatePaymentAfterReleaseParams{
			ID:                payment.ID,
			Status:            "refunded",
			PlatformFee:       fmt.Sprintf("%.2f", platformFee),
			NetAmount:         fmt.Sprintf("%.2f", netAmount),
			WithdrawReference: sql.NullString{String: withdrawResp.Reference, Valid: true},
			ReceiptNumber:     sql.NullString{String: receiptNumber, Valid: true},
			ReceiptPdfUrl:     sql.NullString{String: receiptURL, Valid: receiptURL != ""},
			RejectionReason:   sql.NullString{String: reqBody.Reason, Valid: reqBody.Reason != ""},
		})
		if err != nil {
			return err
		}
		updated = u
		_, err = qtx.UpdateProductStatus(c.Request.Context(), db.UpdateProductStatusParams{
			ID:       payment.ProductID,
			SellerID: payment.SellerID,
			Status:   "available",
		})
		return err
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update payment record"})
		return
	}

	// Notify seller via WebSocket
	h.hub.Broadcast <- ws.Message{
		SenderID:   buyerID.String(),
		ReceiverID: payment.SellerID.String(),
		Content:    fmt.Sprintf("❌ Buyer rejected '%s'. The item is now available again.", payment.ProductTitle),
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "delivery rejected, refund processed",
		"receipt_number": receiptNumber,
		"receipt_url":    receiptURL,
		"payment":        models.ToPaymentResponse(updated),
	})
}

func (h *PaymentHandler) GetMyPurchases(c *gin.Context) {
	buyerID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	page := httpx.ParsePagination(c, 50, 100)
	payments, err := h.queries.GetBuyerPayments(c.Request.Context(), db.GetBuyerPaymentsParams{
		BuyerID: buyerID,
		Limit:   page.Limit,
		Offset:  page.Offset,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch purchases"})
		return
	}

	response := make([]models.PaymentResponse, len(payments))
	for i, p := range payments {
		response[i] = models.ToBuyerPaymentResponse(p)
	}

	c.JSON(http.StatusOK, gin.H{
		"purchases": response,
		"count":     len(response),
	})
}

func (h *PaymentHandler) GetMySales(c *gin.Context) {
	sellerID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	page := httpx.ParsePagination(c, 50, 100)
	payments, err := h.queries.GetSellerPayments(c.Request.Context(), db.GetSellerPaymentsParams{
		SellerID: sellerID,
		Limit:    page.Limit,
		Offset:   page.Offset,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch sales"})
		return
	}

	response := make([]models.PaymentResponse, len(payments))
	for i, p := range payments {
		response[i] = models.ToSellerPaymentResponse(p)
	}

	c.JSON(http.StatusOK, gin.H{
		"sales": response,
		"count": len(response),
	})
}

func (h *PaymentHandler) GetReceipt(c *gin.Context) {
	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	payment, err := h.queries.GetPaymentByID(c.Request.Context(), paymentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	// Only the buyer or seller may fetch a payment's receipt.
	if !requirePaymentParty(c, payment.BuyerID, payment.SellerID) {
		return
	}

	if !payment.ReceiptPdfUrl.Valid || payment.ReceiptPdfUrl.String == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "receipt not available yet"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"receipt_number":  payment.ReceiptNumber.String,
		"receipt_pdf_url": payment.ReceiptPdfUrl.String,
		"status":          payment.Status,
	})
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

func (h *PaymentHandler) GetAllHeldPayments(c *gin.Context) {
	page := httpx.ParsePagination(c, 50, 100)
	payments, err := h.queries.GetAllHeldPayments(c.Request.Context(), db.GetAllHeldPaymentsParams{
		Limit:  page.Limit,
		Offset: page.Offset,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch held payments"})
		return
	}

	response := make([]models.PaymentResponse, len(payments))
	for i, p := range payments {
		response[i] = models.ToHeldPaymentResponse(p)
	}

	c.JSON(http.StatusOK, gin.H{
		"payments": response,
		"count":    len(response),
	})
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// requirePaymentParty ensures the caller is the buyer or seller of the payment.
// On failure it writes the same 403 body the inline checks used and returns
// false so the caller can `return`.
func requirePaymentParty(c *gin.Context, buyerID, sellerID uuid.UUID) bool {
	callerID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil || (callerID != buyerID && callerID != sellerID) {
		httpx.Error(c, http.StatusForbidden, "you are not a party to this payment")
		return false
	}
	return true
}

// revertProductToAvailable puts a claimed product back to 'available' after a
// downstream failure (payment collection or CreatePayment) so the item isn't
// stuck in 'in_escrow'. Best-effort: failure is logged, not fatal.
func (h *PaymentHandler) revertProductToAvailable(ctx context.Context, productID, sellerID uuid.UUID) {
	if _, err := h.queries.UpdateProductStatus(ctx, db.UpdateProductStatusParams{
		ID:       productID,
		SellerID: sellerID,
		Status:   "available",
	}); err != nil {
		log.Printf("error reverting product %s to available: %v", productID, err)
	}
}

// isUniqueViolation reports whether err is a Postgres unique-constraint
// violation (SQLSTATE 23505) — e.g. the one-active-payment-per-product index.
func isUniqueViolation(err error) bool {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		return pqErr.Code == "23505"
	}
	return false
}

// devBypassEnabled reports whether payment collection should be simulated.
// It requires the opt-in env flag AND a non-production environment, so a leaked
// or copy-pasted DEV_BYPASS_PAYMENT=true can never disable real payments in prod.
func devBypassEnabled() bool {
	return os.Getenv("DEV_BYPASS_PAYMENT") == "true" && os.Getenv("ENV") != "production"
}

// computePlatformFee returns the platform fee for an amount at the given rate,
// rounded to a whole XAF unit (the currency has no minor units).
func computePlatformFee(amount, rate float64) float64 {
	return math.Round(amount * rate)
}

func detectOperator(phone string) string {
	// prefix is phone[3:6], which needs at least 6 characters.
	if len(phone) < 6 {
		return "unknown"
	}
	prefix := phone[3:6]
	mtnPrefixes := map[string]bool{
		"650": true, "651": true, "652": true, "653": true,
		"654": true, "670": true, "671": true, "672": true,
		"673": true, "674": true, "675": true, "676": true,
		"677": true, "678": true, "679": true,
	}
	if mtnPrefixes[prefix] {
		return "MTN"
	}
	return "Orange"
}

// StartPendingPaymentExpirer runs a background loop that expires payments
// stuck in "pending" for more than 5 minutes and reverts the product to
// "available". Call it as a goroutine.
func (h *PaymentHandler) StartPendingPaymentExpirer(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	log.Printf("pending-payment expirer started (interval=%v)", interval)

	for {
		select {
		case <-ctx.Done():
			log.Println("pending-payment expirer stopped")
			return
		case <-ticker.C:
			// Isolate each tick: a panic here must not kill the goroutine.
			func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("expirer: recovered from panic: %v", r)
					}
				}()
				payments, err := h.queries.GetStalePendingPayments(ctx)
				if err != nil {
					log.Printf("expirer: error fetching stale payments: %v", err)
					return
				}
				for _, p := range payments {
					_, err := h.queries.UpdatePaymentStatus(ctx, db.UpdatePaymentStatusParams{
						ID:     p.ID,
						Status: "expired",
					})
					if err != nil {
						log.Printf("expirer: error expiring payment %s: %v", p.ID, err)
						continue
					}
					_, err = h.queries.UpdateProductStatus(ctx, db.UpdateProductStatusParams{
						ID:       p.ProductID,
						SellerID: p.SellerID,
						Status:   "available",
					})
					if err != nil {
						log.Printf("expirer: error reverting product %s to available: %v", p.ProductID, err)
					}
					log.Printf("expirer: expired payment %s for product %s", p.ID, p.ProductID)
				}
			}()
		}
	}
}

// StartStuckPaymentReconciler runs a background loop that surfaces payments
// stuck mid-release ('releasing'/'refunding') for more than 10 minutes — the
// tell-tale of a crash between the CamPay withdrawal and the follow-up DB
// commit. It does NOT auto-resolve them (money may already have moved); it logs
// each as a WARNING with id + reference for operator follow-up. Call it as a
// goroutine. NOTE: the lead must add `go paymentHandler.StartStuckPaymentReconciler(ctx, ...)`
// in routes.go — this file does not (and must not) edit routes.go.
func (h *PaymentHandler) StartStuckPaymentReconciler(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	log.Printf("stuck-payment reconciler started (interval=%v)", interval)

	for {
		select {
		case <-ctx.Done():
			log.Println("stuck-payment reconciler stopped")
			return
		case <-ticker.C:
			// Isolate each tick: a panic here must not kill the goroutine.
			func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("reconciler: recovered from panic: %v", r)
					}
				}()
				payments, err := h.queries.GetStuckReleasingPayments(ctx)
				if err != nil {
					log.Printf("reconciler: error fetching stuck payments: %v", err)
					return
				}
				for _, p := range payments {
					log.Printf("WARNING reconciler: payment %s (reference=%q) stuck in status %q since %s — needs manual follow-up",
						p.ID, p.Reference.String, p.Status, p.UpdatedAt.Format(time.RFC3339))
				}
			}()
		}
	}
}
