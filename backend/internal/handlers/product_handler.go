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
	// 1. Get seller ID from JWT context
	sellerIDStr := c.GetString("user_id")
	sellerID, err := uuid.Parse(sellerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	// 2. Parse form fields
	title := c.PostForm("title")
	description := c.PostForm("description")
	price := c.PostForm("price")
	categoryIDStr := c.PostForm("category_id")

	if title == "" || description == "" || price == "" || categoryIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title, description, price and category_id are required"})
		return
	}

	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	// 3. Get image file if provided
	var mf multipart.File
	fileHeader, err := c.FormFile("image")
	if err == nil && fileHeader != nil {
		mf, err = fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "could not read image file"})
			return
		}
		defer mf.Close()
	}

	// 4. Call service
	product, err := h.productService.CreateProduct(
		c.Request.Context(),
		sellerID,
		int32(categoryID),
		title,
		description,
		price,
		mf,
	)
	if err != nil {
		log.Printf("Create product error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create product"})
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
	//Gets seller ID from JWT
	sellerIDStr := c.GetString("user_id")
	sellerID, err := uuid.Parse(sellerIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	// Gets product ID from URL
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	// Gets existing product to retrieve current image URL
	existing, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	// Parses form fields
	title := c.PostForm("title")
	description := c.PostForm("description")
	price := c.PostForm("price")
	categoryIDStr := c.PostForm("category_id")

	if title == "" || description == "" || price == "" || categoryIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title, description, price and category_id are required"})
		return
	}

	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	//Handle image upload
	var mf multipart.File
	fileHeader, err := c.FormFile("image")
	if err == nil && fileHeader != nil {
		mf, err = fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "could not read image"})
			return
		}
		defer mf.Close()
	}

	existingImage := ""
	if existing.ImageUrl.Valid {
		existingImage = existing.ImageUrl.String
	}

	//Call service
	product, err := h.productService.UpdateProduct(
		c.Request.Context(),
		productID,
		sellerID,
		int32(categoryID),
		title,
		description,
		price,
		mf,
		existingImage,
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

	// Gets product to retrieve image URL before deleting
	existing, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	imageURL := ""
	if existing.ImageUrl.Valid {
		imageURL = existing.ImageUrl.String
	}

	if err := h.productService.DeleteProduct(
		c.Request.Context(),
		productID,
		sellerID,
		imageURL,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product deleted successfully"})
}