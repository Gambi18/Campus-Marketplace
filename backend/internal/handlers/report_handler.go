package handlers

import (
	"net/http"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReportHandler struct {
	queries *db.Queries
}

func NewReportHandler(queries *db.Queries) *ReportHandler {
	return &ReportHandler{queries: queries}
}

func (h *ReportHandler) CreateReport(c *gin.Context) {
	reporterIDStr := c.GetString("user_id")
	reporterID, err := uuid.Parse(reporterIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	var req models.CreateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	if _, err := h.queries.GetProductByID(c.Request.Context(), productID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	report, err := h.queries.CreateReport(c.Request.Context(), db.CreateReportParams{
		ReporterID: reporterID,
		ProductID:  productID,
		Reason:     req.Reason,
		Details:    req.Details,
	})
	if err != nil {
		// unique constraint violation - already reported this product
		c.JSON(http.StatusConflict, gin.H{"error": "you have already reported this product"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "report submitted successfully",
		"report":  models.ToBasicReportResponse(report),
	})
}

func (h *ReportHandler) GetMyReports(c *gin.Context) {
	reporterIDStr := c.GetString("user_id")
	reporterID, err := uuid.Parse(reporterIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	reports, err := h.queries.GetReportsByReporterID(c.Request.Context(), reporterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch your reports"})
		return
	}

	response := make([]models.ReportResponse, len(reports))
	for i, r := range reports {
		response[i] = models.ToReporterReportResponse(r)
	}

	c.JSON(http.StatusOK, gin.H{
		"reports": response,
		"count":   len(response),
	})
}



func (h *ReportHandler) GetAllReports(c *gin.Context) {
	// Optional status filter via query param e.g. ?status=pending
	status := c.Query("status")

	if status != "" {
		reports, err := h.queries.GetReportsByStatus(c.Request.Context(), status)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch reports"})
			return
		}

		response := make([]models.ReportResponse, len(reports))
		for i, r := range reports {
			response[i] = models.ToStatusReportResponse(r)
		}

		c.JSON(http.StatusOK, gin.H{
			"reports": response,
			"count":   len(response),
			"status":  status,
		})
		return
	}

	// No filter - return all
	reports, err := h.queries.GetAllReports(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch reports"})
		return
	}

	response := make([]models.ReportResponse, len(reports))
	for i, r := range reports {
		response[i] = models.ToReportResponse(r)
	}

	c.JSON(http.StatusOK, gin.H{
		"reports": response,
		"count":   len(response),
	})
}

func (h *ReportHandler) GetReportByID(c *gin.Context) {
	reportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report ID"})
		return
	}

	report, err := h.queries.GetReportByID(c.Request.Context(), reportID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
		return
	}

	c.JSON(http.StatusOK, models.ToGetByIDReportResponse(report))
}

func (h *ReportHandler) UpdateReportStatus(c *gin.Context) {
	reportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report ID"})
		return
	}

	var req models.UpdateReportStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.queries.UpdateReportStatus(c.Request.Context(), db.UpdateReportStatusParams{
		ID:     reportID,
		Status: req.Status,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update report status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "report status updated successfully",
		"report":  models.ToBasicReportResponse(report),
	})
}