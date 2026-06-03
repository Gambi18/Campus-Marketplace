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
	ID string `json:"id"`
	Username string `json:"username"`
	Email string `json:"email"`
	Role string `json:"role"`
	IsVerified bool `json:"is_verified"`
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
    ImageURL     string `json:"image_url"`
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
        ImageURL:     p.ImageUrl.String,
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
        ImageURL:     p.ImageUrl.String,
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
        ImageURL:     p.ImageUrl.String,
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
        ImageURL:     p.ImageUrl.String,
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
        ImageURL:     p.ImageUrl.String,
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
        ImageURL:    p.ImageUrl.String,
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