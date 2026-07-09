package handlers

import (
	"net/http"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/platform/httpx"

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
	reporterID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	var req models.CreateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	if _, err := h.queries.GetProductByID(c.Request.Context(), productID); err != nil {
		httpx.Error(c, http.StatusNotFound, "product not found")
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
		httpx.Error(c, http.StatusConflict, "you have already reported this product")
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "report submitted successfully",
		"report":  models.ToBasicReportResponse(report),
	})
}

func (h *ReportHandler) GetMyReports(c *gin.Context) {
	reporterID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	p := httpx.ParsePagination(c, 50, 100)
	reports, err := h.queries.GetReportsByReporterID(c.Request.Context(), db.GetReportsByReporterIDParams{
		ReporterID: reporterID,
		Limit:      p.Limit,
		Offset:     p.Offset,
	})
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not fetch your reports")
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
	p := httpx.ParsePagination(c, 50, 100)

	if status != "" {
		reports, err := h.queries.GetReportsByStatus(c.Request.Context(), db.GetReportsByStatusParams{
			Status: status,
			Limit:  p.Limit,
			Offset: p.Offset,
		})
		if err != nil {
			httpx.Error(c, http.StatusInternalServerError, "could not fetch reports")
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
	reports, err := h.queries.GetAllReports(c.Request.Context(), db.GetAllReportsParams{
		Limit:  p.Limit,
		Offset: p.Offset,
	})
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not fetch reports")
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
		httpx.Error(c, http.StatusBadRequest, "invalid report ID")
		return
	}

	report, err := h.queries.GetReportByID(c.Request.Context(), reportID)
	if err != nil {
		httpx.Error(c, http.StatusNotFound, "report not found")
		return
	}

	c.JSON(http.StatusOK, models.ToGetByIDReportResponse(report))
}

func (h *ReportHandler) UpdateReportStatus(c *gin.Context) {
	reportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "invalid report ID")
		return
	}

	var req models.UpdateReportStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	report, err := h.queries.UpdateReportStatus(c.Request.Context(), db.UpdateReportStatusParams{
		ID:     reportID,
		Status: req.Status,
	})
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not update report status")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "report status updated successfully",
		"report":  models.ToBasicReportResponse(report),
	})
}
