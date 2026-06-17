package models
import (
    
    db "campus-marketplace/internal/db/sqlc"
)

// Product represents a marketplace product
type Product struct {
	ID          string  `json:"id" bson:"_id"`
	Title       string  `json:"title" bson:"title" binding:"required"`
	Description string  `json:"description" bson:"description"`
	Price       float64 `json:"price" bson:"price" binding:"required"`
	SellerID    string  `json:"seller_id" bson:"seller_id" binding:"required"`
	Category    string  `json:"category" bson:"category"`
	Images      []string `json:"images" bson:"images"`
	CreatedAt   int64   `json:"created_at" bson:"created_at"`
	UpdatedAt   int64   `json:"updated_at" bson:"updated_at"`
}

// User represents a marketplace user
type User struct {
	ID        string `json:"id" bson:"_id"`
	Email     string `json:"email" bson:"email" binding:"required,email"`
	Username  string `json:"username" bson:"username" binding:"required"`
	Password  string `json:"password" bson:"password" binding:"required"`
	FullName  string `json:"full_name" bson:"full_name"`
	CreatedAt int64  `json:"created_at" bson:"created_at"`
	UpdatedAt int64  `json:"updated_at" bson:"updated_at"`
}

// Registration is what the user send while signin up
type RegisterRequest struct {
	Username  string `json:"username" binding:"required,min=3,max=50"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6,max=50"`

}
// what user sends while logging in
type LoginRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required"`

}

//AuthResponse is what we send after register or login

type AuthResponse struct {
	Token string  `json:"token"`
	User UserResponse `json:"user"`
}

type UserResponse struct {
	ID            string `json:"id"`
	FullName      string `json:"full_name"`
	Username      string `json:"username"`
	Email         string `json:"email"`
	IsVerified    bool   `json:"is_verified"`
	AccountStatus string `json:"account_status"`
	StudentIDUrl  string `json:"student_id_url,omitempty"`
}

type AdminResponse struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
}

type AdminAuthResponse struct {
	Token string        `json:"token"`
	Admin AdminResponse `json:"admin"`
}

type CreateAdminRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=50"`
}

func ToUserResponse(u db.User) UserResponse {
	return UserResponse{
		ID:            u.ID.String(),
		FullName:      u.FullName,
		Username:      u.Username,
		Email:         u.Email,
		IsVerified:    u.IsVerified,
		AccountStatus: u.AccountStatus,
		StudentIDUrl:  u.StudentIDUrl,
	}
}

func ToAdminResponse(a db.Admin) AdminResponse {
	return AdminResponse{
		ID:        a.ID.String(),
		Username:  a.Username,
		Email:     a.Email,
		CreatedAt: a.CreatedAt.String(),
	}
}

//  admin request to reject with reason shown to user
type UpdateAccountStatusRequest struct {
    Status string `json:"status" binding:"required,oneof=approved rejected"`
}

// CATEGORY MODELS
type CreateCategoryRequest struct {
    Name        string `json:"name"        binding:"required"`
    Description string `json:"description"`
}

type CategoryResponse struct {
    ID          int32  `json:"id"`
    Name        string `json:"name"`
    Description string `json:"description"`
}

func ToCategoryResponse(c db.Category) CategoryResponse {
    return CategoryResponse{
        ID:          c.ID,
        Name:        c.Name,
        Description: c.Description.String,
    }
}

// PRODUCT MODELS
type UpdateStatusRequest struct {
    Status string `json:"status" binding:"required,oneof=available sold removed"`
}

type ProductResponse struct {
    ID           string `json:"id"`
    SellerID     string `json:"seller_id"`
    SellerName   string `json:"seller_name,omitempty"`
    CategoryID   int32  `json:"category_id"`
    CategoryName string `json:"category_name,omitempty"`
    Title        string `json:"title"`
    Description  string `json:"description"`
    Price        string `json:"price"`
	Condition    string `json:"condition"`   
	ImageUrl1    string `json:"image_url_1"` 
	ImageUrl2    string `json:"image_url_2"` 
	ImageUrl3    string `json:"image_url_3"` 
	ImageUrl4    string `json:"image_url_4"` 

    Status       string `json:"status"`
    CreatedAt    string `json:"created_at"`
}

// function to GetAllProductsRow
func ToProductResponse(p db.GetAllProductsRow) ProductResponse {
    return ProductResponse{
        ID:           p.ID.String(),
        SellerID:     p.SellerID.String(),
        SellerName:   p.SellerName,
        CategoryID:   p.CategoryID,
        CategoryName: p.CategoryName,
        Title:        p.Title,
        Description:  p.Description,
        Price:        p.Price,
        Condition:    p.Condition,
		ImageUrl1:    p.ImageUrl1,
		ImageUrl2:    p.ImageUrl2,
		ImageUrl3:    p.ImageUrl3,
		ImageUrl4:    p.ImageUrl4,
        Status:       p.Status,
        CreatedAt:    p.CreatedAt.String(),
    }
}
// SearchProductsRow
func ToSearchProductResponse(p db.SearchProductsRow) ProductResponse {
    return ProductResponse{
        ID:           p.ID.String(),
        SellerID:     p.SellerID.String(),
        SellerName:   p.SellerName,
        CategoryID:   p.CategoryID,
        CategoryName: p.CategoryName,
        Title:        p.Title,
        Description:  p.Description,
        Price:        p.Price,
		Condition:    p.Condition,
		ImageUrl1:    p.ImageUrl1,
		ImageUrl2:    p.ImageUrl2,
		ImageUrl3:    p.ImageUrl3,
		ImageUrl4:    p.ImageUrl4,
        Status:       p.Status,
        CreatedAt:    p.CreatedAt.String(),
    }
}

// GetProductsByCategoryRow
func ToCategoryProductResponse(p db.GetProductsByCategoryRow) ProductResponse {
    return ProductResponse{
        ID:           p.ID.String(),
        SellerID:     p.SellerID.String(),
        SellerName:   p.SellerName,
        CategoryID:   p.CategoryID,
        CategoryName: p.CategoryName,
        Title:        p.Title,
        Description:  p.Description,
        Price:        p.Price,
		Condition:    p.Condition,
		ImageUrl1:    p.ImageUrl1,
		ImageUrl2:    p.ImageUrl2,
		ImageUrl3:    p.ImageUrl3,
		ImageUrl4:    p.ImageUrl4,
        Status:       p.Status,
        CreatedAt:    p.CreatedAt.String(),
    }
}

// GetProductsBySellerIDRow
func ToSellerProductResponse(p db.GetProductsBySellerIDRow) ProductResponse {
    return ProductResponse{
        ID:           p.ID.String(),
        SellerID:     p.SellerID.String(),
        SellerName:   p.SellerName,
        CategoryID:   p.CategoryID,
        CategoryName: p.CategoryName,
        Title:        p.Title,
        Description:  p.Description,
        Price:        p.Price,
		Condition:    p.Condition,
		ImageUrl1:    p.ImageUrl1,
		ImageUrl2:    p.ImageUrl2,
		ImageUrl3:    p.ImageUrl3,
		ImageUrl4:    p.ImageUrl4,
        Status:       p.Status,
        CreatedAt:    p.CreatedAt.String(),
    }
}

//  GetProductByIDRow
func ToGetByIDProductResponse(p db.GetProductByIDRow) ProductResponse {
    return ProductResponse{
        ID:           p.ID.String(),
        SellerID:     p.SellerID.String(),
        SellerName:   p.SellerName,
        CategoryID:   p.CategoryID,
        CategoryName: p.CategoryName,
        Title:        p.Title,
        Description:  p.Description,
        Price:        p.Price,
        Condition:    p.Condition,
		ImageUrl1:    p.ImageUrl1,
		ImageUrl2:    p.ImageUrl2,
		ImageUrl3:    p.ImageUrl3,
		ImageUrl4:    p.ImageUrl4,
        Status:       p.Status,
        CreatedAt:    p.CreatedAt.String(),
    }
}

// Product (basic, no joins)
func ToBasicProductResponse(p db.Product) ProductResponse {
    return ProductResponse{
        ID:          p.ID.String(),
        SellerID:    p.SellerID.String(),
        CategoryID:  p.CategoryID,
        Title:       p.Title,
        Description: p.Description,
        Price:       p.Price,
		Condition:   p.Condition,
		ImageUrl1:   p.ImageUrl1,
		ImageUrl2:   p.ImageUrl2,
		ImageUrl3:   p.ImageUrl3,
		ImageUrl4:   p.ImageUrl4,
        Status:      p.Status,
        CreatedAt:   p.CreatedAt.String(),
    }
}

//  REPORT MODELS

type CreateReportRequest struct {
	ProductID string `json:"product_id" binding:"required"`
	Reason    string `json:"reason"     binding:"required,oneof=fake_listing wrong_price scam inappropriate other"`
}

type UpdateReportStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending reviewed resolved"`
}

type ReportResponse struct {
	ID           string `json:"id"`
	ReporterID   string `json:"reporter_id"`
	ReporterName string `json:"reporter_name,omitempty"`
	ProductID    string `json:"product_id"`
	ProductTitle string `json:"product_title,omitempty"`
	Reason       string `json:"reason"`
	Status       string `json:"status"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

//  Report (basic, no joins)
func ToBasicReportResponse(r db.Report) ReportResponse {
	return ReportResponse{
		ID:        r.ID.String(),
		ReporterID: r.ReporterID.String(),
		ProductID:  r.ProductID.String(),
		Reason:     r.Reason,
		Status:     r.Status,
		CreatedAt:  r.CreatedAt.String(),
		UpdatedAt:  r.UpdatedAt.String(),
	}
}

//  GetAllReportsRow
func ToReportResponse(r db.GetAllReportsRow) ReportResponse {
	return ReportResponse{
		ID:           r.ID.String(),
		ReporterID:   r.ReporterID.String(),
		ReporterName: r.ReporterName,
		ProductID:    r.ProductID.String(),
		ProductTitle: r.ProductTitle,
		Reason:       r.Reason,
		Status:       r.Status,
		CreatedAt:    r.CreatedAt.String(),
		UpdatedAt:    r.UpdatedAt.String(),
	}
}

//  GetReportByIDRow
func ToGetByIDReportResponse(r db.GetReportByIDRow) ReportResponse {
	return ReportResponse{
		ID:           r.ID.String(),
		ReporterID:   r.ReporterID.String(),
		ReporterName: r.ReporterName,
		ProductID:    r.ProductID.String(),
		ProductTitle: r.ProductTitle,
		Reason:       r.Reason,
		Status:       r.Status,
		CreatedAt:    r.CreatedAt.String(),
		UpdatedAt:    r.UpdatedAt.String(),
	}
}

//  GetReportsByStatusRow
func ToStatusReportResponse(r db.GetReportsByStatusRow) ReportResponse {
	return ReportResponse{
		ID:           r.ID.String(),
		ReporterID:   r.ReporterID.String(),
		ReporterName: r.ReporterName,
		ProductID:    r.ProductID.String(),
		ProductTitle: r.ProductTitle,
		Reason:       r.Reason,
		Status:       r.Status,
		CreatedAt:    r.CreatedAt.String(),
		UpdatedAt:    r.UpdatedAt.String(),
	}
}

//  GetReportsByReporterIDRow
func ToReporterReportResponse(r db.GetReportsByReporterIDRow) ReportResponse {
	return ReportResponse{
		ID:           r.ID.String(),
		ReporterID:   r.ReporterID.String(),
		ReporterName: r.ReporterName,
		ProductID:    r.ProductID.String(),
		ProductTitle: r.ProductTitle,
		Reason:       r.Reason,
		Status:       r.Status,
		CreatedAt:    r.CreatedAt.String(),
		UpdatedAt:    r.UpdatedAt.String(),
	}
}

type CreateMessageRequest struct {
	ReceiverID string `json:"receiver_id" binding:"required"`
	ProductID  string `json:"product_id"  binding:"required"`
	Content    string `json:"content"     binding:"required"`
}

// MESSAGE MODELS 

type MessageResponse struct {
	ID         string `json:"id"`
	SenderID   string `json:"sender_id"`
	SenderName string `json:"sender_name"`
	ReceiverID string `json:"receiver_id"`
	ProductID  string `json:"product_id"`
	Content    string `json:"content"`
	IsRead     bool   `json:"is_read"`
	CreatedAt  string `json:"created_at"`
}

type ConversationResponse struct {
	ID           string `json:"id"`
	SenderID     string `json:"sender_id"`
	SenderName   string `json:"sender_name"`
	ReceiverID   string `json:"receiver_id"`
	// OtherUserID is the conversation partner relative to the requesting user,
	// computed server-side so the client never has to guess.
	OtherUserID  string `json:"other_user_id"`
	// OtherUserName is the partner's display name, regardless of who sent the
	// last message, so the client never shows the requesting user's own name.
	OtherUserName string `json:"other_user_name"`
	ProductID    string `json:"product_id"`
	ProductTitle string `json:"product_title"`
	ProductImage string `json:"product_image"`
	Content      string `json:"content"`
	IsRead       bool   `json:"is_read"`
	CreatedAt    string `json:"created_at"`
}

// NOTIFICATION MODELS

type NotificationResponse struct {
	ID        string      `json:"id"`
	UserID    string      `json:"user_id"`
	Type      string      `json:"type"`
	Title     string      `json:"title"`
	Message   string      `json:"message"`
	IsRead    bool        `json:"is_read"`
	CreatedAt string      `json:"created_at"`
	Metadata  interface{} `json:"metadata,omitempty"`
	Link      string      `json:"link,omitempty"`
}

func ToNotificationResponse(n db.Notification) NotificationResponse {
	return NotificationResponse{
		ID:        n.ID.String(),
		UserID:    n.UserID.String(),
		Type:      n.Type,
		Title:     n.Title,
		Message:   n.Message,
		IsRead:    n.IsRead.Bool,
		CreatedAt: n.CreatedAt.Time.String(),
		Metadata:  n.Metadata.RawMessage,
		Link:      n.Link.String,
	}
}

type InitiatePaymentRequest struct {
	ProductID   string `json:"product_id"   binding:"required"`
	PhoneNumber string `json:"phone_number" binding:"required"`
}

type PaymentResponse struct {
	ID                string `json:"id"`
	BuyerID           string `json:"buyer_id"`
	BuyerName         string `json:"buyer_name,omitempty"`
	SellerID          string `json:"seller_id"`
	SellerName        string `json:"seller_name,omitempty"`
	ProductID         string `json:"product_id"`
	ProductTitle      string `json:"product_title,omitempty"`
	Amount            string `json:"amount"`
	PlatformFee       string `json:"platform_fee"`
	NetAmount         string `json:"net_amount"`
	PhoneNumber       string `json:"phone_number"`
	Operator          string `json:"operator"`
	Reference         string `json:"reference"`
	WithdrawReference string `json:"withdraw_reference"`
	Status            string `json:"status"`
	ReceiptNumber     string `json:"receipt_number"`
	ReceiptPdfUrl     string `json:"receipt_pdf_url"`
	CreatedAt         string `json:"created_at"`
}

func ToBasicPaymentResponse(p db.Payment) PaymentResponse {
	return PaymentResponse{
		ID:          p.ID.String(),
		BuyerID:     p.BuyerID.String(),
		SellerID:    p.SellerID.String(),
		ProductID:   p.ProductID.String(),
		Amount:      p.Amount,
		PhoneNumber: p.PhoneNumber,
		Operator:    p.Operator,
		Reference:   p.Reference.String,
		Status:      p.Status,
		CreatedAt:   p.CreatedAt.String(),
	}
}

func ToPaymentResponse(p db.Payment) PaymentResponse {
	return PaymentResponse{
		ID:                p.ID.String(),
		BuyerID:           p.BuyerID.String(),
		SellerID:          p.SellerID.String(),
		ProductID:         p.ProductID.String(),
		Amount:            p.Amount,
		PlatformFee:       p.PlatformFee,
		NetAmount:         p.NetAmount,
		PhoneNumber:       p.PhoneNumber,
		Operator:          p.Operator,
		Reference:         p.Reference.String,
		WithdrawReference: p.WithdrawReference.String,
		Status:            p.Status,
		ReceiptNumber:     p.ReceiptNumber.String,
		ReceiptPdfUrl:     p.ReceiptPdfUrl.String,
		CreatedAt:         p.CreatedAt.String(),
	}
}

func ToBuyerPaymentResponse(p db.GetBuyerPaymentsRow) PaymentResponse {
	return PaymentResponse{
		ID:            p.ID.String(),
		BuyerID:       p.BuyerID.String(),
		SellerID:      p.SellerID.String(),
		SellerName:    p.SellerName,
		ProductID:     p.ProductID.String(),
		ProductTitle:  p.ProductTitle,
		Amount:        p.Amount,
		PlatformFee:   p.PlatformFee,
		NetAmount:     p.NetAmount,
		PhoneNumber:   p.PhoneNumber,
		Operator:      p.Operator,
		Reference:     p.Reference.String,
		Status:        p.Status,
		ReceiptNumber: p.ReceiptNumber.String,
		ReceiptPdfUrl: p.ReceiptPdfUrl.String,
		CreatedAt:     p.CreatedAt.String(),
	}
}

func ToSellerPaymentResponse(p db.GetSellerPaymentsRow) PaymentResponse {
	return PaymentResponse{
		ID:            p.ID.String(),
		BuyerID:       p.BuyerID.String(),
		BuyerName:     p.BuyerName,
		SellerID:      p.SellerID.String(),
		ProductID:     p.ProductID.String(),
		ProductTitle:  p.ProductTitle,
		Amount:        p.Amount,
		PlatformFee:   p.PlatformFee,
		NetAmount:     p.NetAmount,
		PhoneNumber:   p.PhoneNumber,
		Operator:      p.Operator,
		Reference:     p.Reference.String,
		Status:        p.Status,
		ReceiptNumber: p.ReceiptNumber.String,
		ReceiptPdfUrl: p.ReceiptPdfUrl.String,
		CreatedAt:     p.CreatedAt.String(),
	}
}

func ToHeldPaymentResponse(p db.GetAllHeldPaymentsRow) PaymentResponse {
	return PaymentResponse{
		ID:            p.ID.String(),
		BuyerID:       p.BuyerID.String(),
		BuyerName:     p.BuyerName,
		SellerID:      p.SellerID.String(),
		SellerName:    p.SellerName,
		ProductID:     p.ProductID.String(),
		ProductTitle:  p.ProductTitle,
		Amount:        p.Amount,
		PlatformFee:   p.PlatformFee,
		NetAmount:     p.NetAmount,
		PhoneNumber:   p.PhoneNumber,
		Operator:      p.Operator,
		Reference:     p.Reference.String,
		Status:        p.Status,
		ReceiptNumber: p.ReceiptNumber.String,
		ReceiptPdfUrl: p.ReceiptPdfUrl.String,
		CreatedAt:     p.CreatedAt.String(),
	}
}