package handlers

import (
	"database/sql"
	"log"
	"mime/multipart"
	"net/http"
	"strconv"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProductHandler struct {
	queries        *db.Queries
	productService *services.ProductService
}

func NewProductHandler(queries *db.Queries, productService *services.ProductService) *ProductHandler {
	return &ProductHandler{
		queries:        queries,
		productService: productService,
	}
}

// PUBLIC ENDPOINTS

func (h *ProductHandler) GetAllProducts(c *gin.Context) {
	products, err := h.queries.GetAllProducts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch products"})
		return
	}

	response := make([]models.ProductResponse, len(products))
	for i, p := range products {
		response[i] = models.ToProductResponse(p)
	}

	c.JSON(http.StatusOK, gin.H{
		"products": response,
		"count":    len(response),
	})
}

func (h *ProductHandler) GetProductByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	product, err := h.queries.GetProductByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	c.JSON(http.StatusOK, models.ToGetByIDProductResponse(product))
}

func (h *ProductHandler) SearchProducts(c *gin.Context) {
	keyword := c.Query("q")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "search keyword is required"})
		return
	}

	products, err := h.queries.SearchProducts(c.Request.Context(), sql.NullString{
		String: keyword,
		Valid:  true,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not search products"})
		return
	}

	response := make([]models.ProductResponse, len(products))
	for i, p := range products {
		response[i] = models.ToSearchProductResponse(p)
	}

	c.JSON(http.StatusOK, gin.H{
		"products": response,
		"count":    len(response),
		"keyword":  keyword,
	})
}

func (h *ProductHandler) GetProductsByCategory(c *gin.Context) {
	categoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	products, err := h.queries.GetProductsByCategory(c.Request.Context(), int32(categoryID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch products"})
		return
	}

	response := make([]models.ProductResponse, len(products))
	for i, p := range products {
		response[i] = models.ToCategoryProductResponse(p)
	}

	c.JSON(http.StatusOK, gin.H{
		"products": response,
		"count":    len(response),
	})
}

//PROTECTED ENDPOINTS 

func (h *ProductHandler) CreateProduct(c *gin.Context) {
	// 1. Get seller ID from JWT
	sellerIDStr := c.GetString("user_id")
	sellerID, err := uuid.Parse(sellerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	// 2. Parse form fields
	title       := c.PostForm("title")
	description := c.PostForm("description")
	price       := c.PostForm("price")
	categoryIDStr := c.PostForm("category_id")
	condition   := c.PostForm("condition")

	if title == "" || description == "" || price == "" || categoryIDStr == "" || condition == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title, description, price, category_id and condition are required"})
		return
	}

	priceFloat, err := strconv.ParseFloat(price, 64)
	if err != nil || priceFloat <= 0 || priceFloat > 10000000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "price must be a positive number"})
		return
	}

	// 3. Validate condition
	validConditions := map[string]bool{
		"brand_new": true, "like_new": true,
		"good": true, "fair": true,
	}
	if !validConditions[condition] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "condition must be one of: brand_new, like_new, good, fair"})
		return
	}

	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	if _, err := h.queries.GetCategoryByID(c.Request.Context(), int32(categoryID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "category does not exist"})
		return
	}

	// 4. Get image 1 — required
	fileHeader1, err := c.FormFile("image_1")
	if err != nil || fileHeader1 == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least one image is required (image_1)"})
		return
	}
	image1, err := fileHeader1.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not read image_1"})
		return
	}
	defer image1.Close()

	// 5. Get images 2, 3, 4 — optional
	var image2, image3, image4 multipart.File

	if fh, err := c.FormFile("image_2"); err == nil && fh != nil {
		image2, _ = fh.Open()
		defer image2.Close()
	}
	if fh, err := c.FormFile("image_3"); err == nil && fh != nil {
		image3, _ = fh.Open()
		defer image3.Close()
	}
	if fh, err := c.FormFile("image_4"); err == nil && fh != nil {
		image4, _ = fh.Open()
		defer image4.Close()
	}

	// 6. Call service
	product, err := h.productService.CreateProduct(
		c.Request.Context(),
		sellerID,
		int32(categoryID),
		title, description, priceFloat, condition,
		image1, image2, image3, image4,
	)
	if err != nil {
		log.Printf("CreateProduct error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "product created successfully",
		"product": models.ToBasicProductResponse(product),
	})
}

func (h *ProductHandler) GetMyProducts(c *gin.Context) {
	sellerIDStr := c.GetString("user_id")
	sellerID, err := uuid.Parse(sellerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	products, err := h.queries.GetProductsBySellerID(c.Request.Context(), sellerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch your products"})
		return
	}

	response := make([]models.ProductResponse, len(products))
	for i, p := range products {
		response[i] = models.ToSellerProductResponse(p)
	}

	c.JSON(http.StatusOK, gin.H{
		"products": response,
		"count":    len(response),
	})
}

func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	// 1. Get seller ID from JWT
	sellerIDStr := c.GetString("user_id")
	sellerID, err := uuid.Parse(sellerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	// 2. Get product ID from URL
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	// 3. Get existing product
	existing, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	// 3b. Enforce ownership explicitly so a non-owner gets 403 rather than a
	// misleading 500 from the seller-scoped UPDATE returning no rows.
	if existing.SellerID != sellerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you do not own this product"})
		return
	}

	// 4. Parse form fields
	title         := c.PostForm("title")
	description   := c.PostForm("description")
	price         := c.PostForm("price")
	categoryIDStr := c.PostForm("category_id")
	condition     := c.PostForm("condition")

	if title == "" || description == "" || price == "" || categoryIDStr == "" || condition == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title, description, price, category_id and condition are required"})
		return
	}

	priceFloat, err := strconv.ParseFloat(price, 64)
	if err != nil || priceFloat <= 0 || priceFloat > 10000000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "price must be a positive number"})
		return
	}

	validConditions := map[string]bool{
		"brand_new": true, "like_new": true,
		"good": true, "fair": true,
	}
	if !validConditions[condition] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "condition must be one of: brand_new, like_new, good, fair"})
		return
	}

	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	if _, err := h.queries.GetCategoryByID(c.Request.Context(), int32(categoryID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "category does not exist"})
		return
	}

	// 5. Get new images if provided
	var image1, image2, image3, image4 multipart.File

	if fh, err := c.FormFile("image_1"); err == nil && fh != nil {
		image1, _ = fh.Open()
		defer image1.Close()
	}
	if fh, err := c.FormFile("image_2"); err == nil && fh != nil {
		image2, _ = fh.Open()
		defer image2.Close()
	}
	if fh, err := c.FormFile("image_3"); err == nil && fh != nil {
		image3, _ = fh.Open()
		defer image3.Close()
	}
	if fh, err := c.FormFile("image_4"); err == nil && fh != nil {
		image4, _ = fh.Open()
		defer image4.Close()
	}

	// 6. Call service
	product, err := h.productService.UpdateProduct(
		c.Request.Context(),
		productID, sellerID,
		int32(categoryID),
		title, description, priceFloat, condition,
		image1, image2, image3, image4,
		existing.ImageUrl1, existing.ImageUrl2,
		existing.ImageUrl3, existing.ImageUrl4,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "product updated successfully",
		"product": models.ToBasicProductResponse(product),
	})
}

func (h *ProductHandler) UpdateProductStatus(c *gin.Context) {
	sellerIDStr := c.GetString("user_id")
	sellerID, err := uuid.Parse(sellerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	var req models.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Load the product to enforce ownership and protect the escrow state machine.
	existing, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	if existing.SellerID != sellerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you do not own this product"})
		return
	}
	// in_escrow / sold are managed by the payment flow — the seller must not be
	// able to flip an item out of escrow (e.g. back to "available") mid-payment.
	if existing.Status == "in_escrow" {
		c.JSON(http.StatusConflict, gin.H{"error": "product is in an active transaction and cannot be changed"})
		return
	}

	product, err := h.queries.UpdateProductStatus(c.Request.Context(), db.UpdateProductStatusParams{
		ID:       productID,
		SellerID: sellerID,
		Status:   req.Status,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update product status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "status updated successfully",
		"product": models.ToBasicProductResponse(product),
	})
}

func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	sellerIDStr := c.GetString("user_id")
	sellerID, err := uuid.Parse(sellerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	existing, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	// Enforce ownership explicitly so a non-owner gets 403 instead of a 200 "deleted
	// successfully" when the seller-scoped DELETE actually matched no rows.
	if existing.SellerID != sellerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you do not own this product"})
		return
	}

	if err := h.productService.DeleteProduct(
		c.Request.Context(),
		productID, sellerID,
		existing.ImageUrl1, existing.ImageUrl2,
		existing.ImageUrl3, existing.ImageUrl4,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product deleted successfully"})
}