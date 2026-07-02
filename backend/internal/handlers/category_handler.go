package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/platform/httpx"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	queries *db.Queries
}

func NewCategoryHandler(queries *db.Queries) *CategoryHandler {
	return &CategoryHandler{queries: queries}
}

func (h *CategoryHandler) GetAllCategories(c *gin.Context) {
	categories, err := h.queries.GetAllCategories(c.Request.Context())
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not fetch categories")
		return
	}

	response := make([]models.CategoryResponse, len(categories))
	for i, cat := range categories {
		response[i] = models.ToCategoryResponse(cat)
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": response,
		"count":      len(response),
	})
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req models.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	category, err := h.queries.CreateCategory(c.Request.Context(), db.CreateCategoryParams{
		Name:        req.Name,
		Description: sql.NullString{String: req.Description, Valid: req.Description != ""},
	})
	if err != nil {
		httpx.Error(c, http.StatusConflict, "category already exists")
		return
	}

	c.JSON(http.StatusCreated, models.ToCategoryResponse(category))
}

func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "invalid category ID")
		return
	}

	var req models.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	category, err := h.queries.UpdateCategory(c.Request.Context(), db.UpdateCategoryParams{
		ID:          int32(id),
		Name:        req.Name,
		Description: sql.NullString{String: req.Description, Valid: req.Description != ""},
	})
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not update category")
		return
	}

	c.JSON(http.StatusOK, models.ToCategoryResponse(category))
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "invalid category ID")
		return
	}

	if err := h.queries.DeleteCategory(c.Request.Context(), int32(id)); err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not delete category")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "category deleted successfully"})
}
