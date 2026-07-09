package handlers

import (
	"database/sql"
	"log"
	"mime/multipart"
	"net/http"
	"strconv"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/platform/httpx"
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

// productInput holds the validated create/update form fields shared by
// CreateProduct and UpdateProduct.
type productInput struct {
	title       string
	description string
	price       float64
	categoryID  int32
	condition   string
}

// validateProductInput parses and validates the shared product form fields,
// performing the price bounds check, the condition whitelist check, the
// category id parse and the category-existence check. On any failure it writes
// the appropriate error response and returns ok=false so the caller can return.
func (h *ProductHandler) validateProductInput(c *gin.Context) (productInput, bool) {
	var in productInput

	in.title = c.PostForm("title")
	in.description = c.PostForm("description")
	price := c.PostForm("price")
	categoryIDStr := c.PostForm("category_id")
	in.condition = c.PostForm("condition")

	if in.title == "" || in.description == "" || price == "" || categoryIDStr == "" || in.condition == "" {
		httpx.Error(c, http.StatusBadRequest, "title, description, price, category_id and condition are required")
		return in, false
	}

	priceFloat, err := strconv.ParseFloat(price, 64)
	if err != nil || priceFloat <= 0 || priceFloat > 10000000 {
		httpx.Error(c, http.StatusBadRequest, "price must be a positive number")
		return in, false
	}
	in.price = priceFloat

	validConditions := map[string]bool{
		"brand_new": true, "like_new": true,
		"good": true, "fair": true,
	}
	if !validConditions[in.condition] {
		httpx.Error(c, http.StatusBadRequest, "condition must be one of: brand_new, like_new, good, fair")
		return in, false
	}

	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "invalid category ID")
		return in, false
	}
	in.categoryID = int32(categoryID)

	if _, err := h.queries.GetCategoryByID(c.Request.Context(), in.categoryID); err != nil {
		httpx.Error(c, http.StatusBadRequest, "category does not exist")
		return in, false
	}

	return in, true
}

// openProductImages best-effort opens the multipart files for the given form
// fields. A field that is absent or fails to open yields a nil entry (mirroring
// the original best-effort behaviour). The returned cleanup closes every opened
// file and should be deferred by the caller.
func openProductImages(c *gin.Context, fields ...string) (files []multipart.File, cleanup func()) {
	files = make([]multipart.File, len(fields))
	for i, field := range fields {
		if fh, err := c.FormFile(field); err == nil && fh != nil {
			files[i], _ = fh.Open()
		}
	}
	cleanup = func() {
		for _, f := range files {
			if f != nil {
				f.Close()
			}
		}
	}
	return files, cleanup
}

func (h *ProductHandler) GetAllProducts(c *gin.Context) {
	p := httpx.ParsePagination(c, 24, 100)
	products, err := h.queries.GetAllProducts(c.Request.Context(), db.GetAllProductsParams{
		Limit:  p.Limit,
		Offset: p.Offset,
	})
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not fetch products")
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
		httpx.Error(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	product, err := h.queries.GetProductByID(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "product not found")
		return
	}

	c.JSON(http.StatusOK, models.ToGetByIDProductResponse(product))
}

func (h *ProductHandler) SearchProducts(c *gin.Context) {
	keyword := c.Query("q")
	if keyword == "" {
		httpx.Error(c, http.StatusBadRequest, "search keyword is required")
		return
	}

	p := httpx.ParsePagination(c, 24, 100)
	products, err := h.queries.SearchProducts(c.Request.Context(), db.SearchProductsParams{
		Keyword: sql.NullString{String: keyword, Valid: true},
		Limit:   p.Limit,
		Offset:  p.Offset,
	})
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not search products")
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
		httpx.Error(c, http.StatusBadRequest, "invalid category ID")
		return
	}

	p := httpx.ParsePagination(c, 24, 100)
	products, err := h.queries.GetProductsByCategory(c.Request.Context(), db.GetProductsByCategoryParams{
		CategoryID: int32(categoryID),
		Limit:      p.Limit,
		Offset:     p.Offset,
	})
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not fetch products")
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

func (h *ProductHandler) CreateProduct(c *gin.Context) {
	sellerID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	in, ok := h.validateProductInput(c)
	if !ok {
		return
	}

	fileHeader1, err := c.FormFile("image_1")
	if err != nil || fileHeader1 == nil {
		httpx.Error(c, http.StatusBadRequest, "at least one image is required (image_1)")
		return
	}
	image1, err := fileHeader1.Open()
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "could not read image_1")
		return
	}
	defer image1.Close()

	optional, cleanup := openProductImages(c, "image_2", "image_3", "image_4")
	defer cleanup()
	image2, image3, image4 := optional[0], optional[1], optional[2]

	product, err := h.productService.CreateProduct(
		c.Request.Context(),
		sellerID,
		in.categoryID,
		in.title, in.description, in.price, in.condition,
		image1, image2, image3, image4,
	)
	if err != nil {
		log.Printf("CreateProduct error: %v", err)
		httpx.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "product created successfully",
		"product": models.ToBasicProductResponse(product),
	})
}

func (h *ProductHandler) GetMyProducts(c *gin.Context) {
	sellerID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	p := httpx.ParsePagination(c, 24, 100)
	products, err := h.queries.GetProductsBySellerID(c.Request.Context(), db.GetProductsBySellerIDParams{
		SellerID: sellerID,
		Limit:    p.Limit,
		Offset:   p.Offset,
	})
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not fetch your products")
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
	sellerID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	existing, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "product not found")
		return
	}

	if existing.SellerID != sellerID {
		httpx.Error(c, http.StatusForbidden, "you do not own this product")
		return
	}

	in, ok := h.validateProductInput(c)
	if !ok {
		return
	}

	imgs, cleanup := openProductImages(c, "image_1", "image_2", "image_3", "image_4")
	defer cleanup()
	image1, image2, image3, image4 := imgs[0], imgs[1], imgs[2], imgs[3]

	product, err := h.productService.UpdateProduct(
		c.Request.Context(),
		productID, sellerID,
		in.categoryID,
		in.title, in.description, in.price, in.condition,
		image1, image2, image3, image4,
		existing.ImageUrl1, existing.ImageUrl2,
		existing.ImageUrl3, existing.ImageUrl4,
	)
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not update product")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "product updated successfully",
		"product": models.ToBasicProductResponse(product),
	})
}

func (h *ProductHandler) UpdateProductStatus(c *gin.Context) {
	sellerID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	var req models.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	// Load the product to enforce ownership and protect the escrow state machine.
	existing, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "product not found")
		return
	}
	if existing.SellerID != sellerID {
		httpx.Error(c, http.StatusForbidden, "you do not own this product")
		return
	}
	// in_escrow / sold are managed by the payment flow — the seller must not be
	// able to flip an item out of escrow (e.g. back to "available") mid-payment.
	if existing.Status == "in_escrow" {
		httpx.Error(c, http.StatusConflict, "product is in an active transaction and cannot be changed")
		return
	}

	product, err := h.queries.UpdateProductStatus(c.Request.Context(), db.UpdateProductStatusParams{
		ID:       productID,
		SellerID: sellerID,
		Status:   req.Status,
	})
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not update product status")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "status updated successfully",
		"product": models.ToBasicProductResponse(product),
	})
}

func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	sellerID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	existing, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "product not found")
		return
	}

	// Enforce ownership explicitly so a non-owner gets 403 instead of a 200 "deleted
	// successfully" when the seller-scoped DELETE actually matched no rows.
	if existing.SellerID != sellerID {
		httpx.Error(c, http.StatusForbidden, "you do not own this product")
		return
	}

	if err := h.productService.DeleteProduct(
		c.Request.Context(),
		productID, sellerID,
		existing.ImageUrl1, existing.ImageUrl2,
		existing.ImageUrl3, existing.ImageUrl4,
	); err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not delete product")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product deleted successfully"})
}
