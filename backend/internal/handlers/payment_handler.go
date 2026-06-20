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
	"campus-marketplace/internal/services"
	"campus-marketplace/internal/ws"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentHandler struct {
	queries        *db.Queries
	campayService  *services.CamPayService
	receiptService *services.ReceiptService
	cloudinary     *services.CloudinaryService
	hub            *ws.Hub
}

func NewPaymentHandler(
	queries *db.Queries,
	campayService *services.CamPayService,
	receiptService *services.ReceiptService,
	cloudinary *services.CloudinaryService,
	hub *ws.Hub,
) *PaymentHandler {
	return &PaymentHandler{
		queries:        queries,
		campayService:  campayService,
		receiptService: receiptService,
		cloudinary:     cloudinary,
		hub:            hub,
	}
}

//INITIATE PAYMENT 

func (h *PaymentHandler) InitiatePayment(c *gin.Context) {
	// 1. Get buyer ID from JWT
	buyerIDStr := c.GetString("user_id")
	buyerID, err := uuid.Parse(buyerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	// 2. Parse request
	var req models.InitiatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. Get product
	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	product, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	// 4. Validate product is available
	if product.Status != "available" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product is not available for purchase"})
		return
	}

	// 5. Prevent buyer from buying their own product
	if product.SellerID == buyerID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "you cannot buy your own product"})
		return
	}

	// 6. Collect payment (skip CamPay in dev bypass mode)
	var reference string
	var operator string

	if os.Getenv("DEV_BYPASS_PAYMENT") == "true" {
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
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		reference = collectResp.Reference
		operator = collectResp.Operator
		if operator == "" {
			operator = detectOperator(req.PhoneNumber)
		}
	}

	// 7. Save payment to DB
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save payment"})
		return
	}

	// 9. Update product status to in_escrow
	_, err = h.queries.UpdateProductStatus(c.Request.Context(), db.UpdateProductStatusParams{
		ID:       productID,
		SellerID: product.SellerID,
		Status:   "in_escrow",
	})
	if err != nil {
		log.Printf("error updating product status: %v", err)
	}

	// In dev bypass mode, auto-confirm the payment to "held" status
	if os.Getenv("DEV_BYPASS_PAYMENT") == "true" {
		_, err = h.queries.UpdatePaymentToHeld(c.Request.Context(),
			sql.NullString{String: reference, Valid: true},
		)
		if err != nil {
			log.Printf("dev-bypass: error updating payment to held: %v", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "payment initiated successfully, please confirm on your phone",
		"reference": reference,
		"payment":   models.ToBasicPaymentResponse(payment),
	})
}

// WEBHOOK 

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
			log.Printf("webhook: error updating payment to held: %v", err)
		}
		log.Printf("Payment %s confirmed and held in escrow", reference)
	}

	c.JSON(http.StatusOK, gin.H{"message": "webhook received"})
}

// CHECK PAYMENT STATUS 

func (h *PaymentHandler) CheckPaymentStatus(c *gin.Context) {
	// Get payment ID from URL
	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	// Fetch payment to get CamPay reference
	payment, err := h.queries.GetPaymentByID(c.Request.Context(), paymentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	// Only the buyer or seller may inspect a payment's details.
	if callerID, err := uuid.Parse(c.GetString("user_id")); err != nil ||
		(payment.BuyerID != callerID && payment.SellerID != callerID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a party to this payment"})
		return
	}

	// Check reference exists
	if !payment.Reference.Valid || payment.Reference.String == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment has no CamPay reference yet"})
		return
	}

	// Dev bypass: use local DB status instead of calling CamPay
	if os.Getenv("DEV_BYPASS_PAYMENT") == "true" && strings.HasPrefix(payment.Reference.String, "dev-bypass-") {
		c.JSON(http.StatusOK, gin.H{
			"payment_id": payment.ID.String(),
			"reference":  payment.Reference.String,
			"status":     "SUCCESSFUL",
			"amount":     payment.Amount,
			"operator":   payment.Operator,
		})
		return
	}

	// Check status with CamPay
	status, err := h.campayService.GetTransactionStatus(payment.Reference.String)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not check payment status"})
		return
	}

	// If SUCCESSFUL and still pending — update to held
	if status.Status == "SUCCESSFUL" && payment.Status == "pending" {
		_, err = h.queries.UpdatePaymentToHeld(c.Request.Context(),
			sql.NullString{String: payment.Reference.String, Valid: true},
		)
		if err != nil {
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

//BUYER CONFIRMS 

func (h *PaymentHandler) ConfirmDelivery(c *gin.Context) {
	buyerIDStr := c.GetString("user_id")
	buyerID, err := uuid.Parse(buyerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	// Parse rejection reason
	var reqBody struct {
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&reqBody); err != nil {
		// body is optional — swallow bind errors so existing callers without a body still work
		reqBody.Reason = ""
	}

	// Get payment
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
	platformFee := math.Round(amount * 0.03)
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

	// Generate receipt number
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

	// Update payment record
	updated, err := h.queries.UpdatePaymentAfterRelease(c.Request.Context(), db.UpdatePaymentAfterReleaseParams{
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update payment record"})
		return
	}

	// Update product to sold
	_, err = h.queries.UpdateProductStatus(c.Request.Context(), db.UpdateProductStatusParams{
		ID:       payment.ProductID,
		SellerID: payment.SellerID,
		Status:   "sold",
	})
	if err != nil {
		log.Printf("error updating product to sold: %v", err)
	}

	// Notify seller via WebSocket
	h.hub.Broadcast <- ws.Message{
		SenderID:   buyerIDStr,
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

//  BUYER REJECTS 

func (h *PaymentHandler) RejectDelivery(c *gin.Context) {
	buyerIDStr := c.GetString("user_id")
	buyerID, err := uuid.Parse(buyerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment ID"})
		return
	}

	// Parse rejection reason
	var reqBody struct {
		Reason string `json:"reason"`
	}
	if err = c.ShouldBindJSON(&reqBody); err != nil {
		reqBody.Reason = ""
	}

	// Get payment
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
	platformFee := math.Round(amount * 0.01)
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

	// Generate receipt number
	receiptNumber := fmt.Sprintf("CM-REF-%d-%06d", time.Now().Year(), time.Now().UnixNano()%1000000)

	// Generate PDF receipt
	receiptURL, err := h.receiptService.GenerateAndUpload(c.Request.Context(), services.ReceiptData{
		ReceiptNumber: receiptNumber,
		Date:          time.Now(),
		BuyerName:     payment.BuyerName,
		SellerName:    payment.SellerName,
		ProductTitle:  payment.ProductTitle,
		CategoryName: product.CategoryName,
		Condition:    product.Condition,
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

	// Update payment record
	updated, err := h.queries.UpdatePaymentAfterRelease(c.Request.Context(), db.UpdatePaymentAfterReleaseParams{
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update payment record"})
		return
	}

	// Put product back to available
	_, err = h.queries.UpdateProductStatus(c.Request.Context(), db.UpdateProductStatusParams{
		ID:       payment.ProductID,
		SellerID: payment.SellerID,
		Status:   "available",
	})
	if err != nil {
		log.Printf("error updating product back to available: %v", err)
	}

	// Notify seller via WebSocket
	h.hub.Broadcast <- ws.Message{
		SenderID:   buyerIDStr,
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

//  HISTORY 
func (h *PaymentHandler) GetMyPurchases(c *gin.Context) {
	buyerIDStr := c.GetString("user_id")
	buyerID, err := uuid.Parse(buyerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	payments, err := h.queries.GetBuyerPayments(c.Request.Context(), buyerID)
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
	sellerIDStr := c.GetString("user_id")
	sellerID, err := uuid.Parse(sellerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	payments, err := h.queries.GetSellerPayments(c.Request.Context(), sellerID)
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
	if callerID, err := uuid.Parse(c.GetString("user_id")); err != nil ||
		(payment.BuyerID != callerID && payment.SellerID != callerID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a party to this payment"})
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
	payments, err := h.queries.GetAllHeldPayments(c.Request.Context())
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

func detectOperator(phone string) string {
	if len(phone) < 5 {
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
			payments, err := h.queries.GetStalePendingPayments(ctx)
			if err != nil {
				log.Printf("expirer: error fetching stale payments: %v", err)
				continue
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
		}
	}
}