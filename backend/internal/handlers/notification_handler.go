package handlers

import (
	"net/http"

	"campus-marketplace/internal/models"
	"campus-marketplace/internal/notification"
	"campus-marketplace/internal/platform/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	service *notification.NotificationService
}

func NewNotificationHandler(service *notification.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: service}
}

func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	notifications, err := h.service.GetUserNotifications(c.Request.Context(), userID)
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not fetch notifications")
		return
	}

	response := make([]models.NotificationResponse, len(notifications))
	for i, n := range notifications {
		response[i] = models.ToNotificationResponse(n)
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": response,
		"count":         len(response),
	})
}

func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	count, err := h.service.GetUnreadCount(c.Request.Context(), userID)
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not fetch unread count")
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, http.StatusBadRequest, "invalid notification ID")
		return
	}

	err = h.service.MarkAsRead(c.Request.Context(), userID, notificationID)
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not mark notification as read")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "notification marked as read"})
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	err := h.service.MarkAllAsRead(c.Request.Context(), userID)
	if err != nil {
		httpx.Error(c, http.StatusInternalServerError, "could not mark all notifications as read")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "all notifications marked as read"})
}
