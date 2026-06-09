package handlers

import (
	"net/http"

	"campus-marketplace/internal/models"
	"campus-marketplace/internal/notification"

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
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	notifications, err := h.service.GetUserNotifications(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch notifications"})
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
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	count, err := h.service.GetUnreadCount(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid notification ID"})
		return
	}

	err = h.service.MarkAsRead(c.Request.Context(), userID, notificationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "notification marked as read"})
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	err = h.service.MarkAllAsRead(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not mark all notifications as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "all notifications marked as read"})
}
