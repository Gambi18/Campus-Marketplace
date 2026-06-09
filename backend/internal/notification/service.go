package notification

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/ws"

	"github.com/google/uuid"
	"github.com/sqlc-dev/pqtype"
)

type NotificationService struct {
	queries *db.Queries
	hub     *ws.Hub
}

func NewNotificationService(queries *db.Queries, hub *ws.Hub) *NotificationService {
	return &NotificationService{
		queries: queries,
		hub:     hub,
	}
}

func (s *NotificationService) Create(ctx context.Context, userID uuid.UUID, nType, title, message string, metadata NotificationMetadata, link string) (*db.Notification, error) {
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal metadata: %w", err)
	}

	var sqlLink sql.NullString
	if link != "" {
		sqlLink = sql.NullString{String: link, Valid: true}
	}

	notification, err := s.queries.CreateNotification(ctx, db.CreateNotificationParams{
		UserID:   userID,
		Type:     nType,
		Title:    title,
		Message:  message,
		Metadata: pqtype.NullRawMessage{RawMessage: metadataJSON, Valid: true},
		Link:     sqlLink,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create notification: %w", err)
	}

	// Emit websocket event
	s.hub.BroadcastToUser(userID.String(), ws.Message{
		Type: "notification",
		Payload: map[string]interface{}{
			"id":         notification.ID,
			"type":       notification.Type,
			"title":      notification.Title,
			"message":    notification.Message,
			"created_at": notification.CreatedAt,
		},
	})

	// Check preferences and create email job if needed
	go s.processEmailNotification(notification)

	return &notification, nil
}

func (s *NotificationService) processEmailNotification(n db.Notification) {
	ctx := context.Background()
	prefs, err := s.queries.GetNotificationPreferences(ctx, n.UserID)
	if err != nil {
		// If no preferences, create default
		prefs, err = s.queries.CreateDefaultNotificationPreferences(ctx, n.UserID)
		if err != nil {
			return
		}
	}

	shouldSendEmail := false
	switch n.Type {
	case NotificationNewMessage:
		shouldSendEmail = prefs.EmailMessages.Bool
	case NotificationNewOffer:
		shouldSendEmail = prefs.EmailOffers.Bool
	case NotificationItemSold:
		shouldSendEmail = prefs.EmailSales.Bool
	// Add other mappings
	}

	if shouldSendEmail {
		user, err := s.queries.GetUserByID(ctx, n.UserID)
		if err != nil {
			return
		}

		_, _ = s.queries.CreateEmailJob(ctx, db.CreateEmailJobParams{
			NotificationID: uuid.NullUUID{UUID: n.ID, Valid: true},
			RecipientEmail: user.Email,
			Subject:        n.Title,
			TemplateName:   s.getTemplateForType(n.Type),
			Payload:        n.Metadata,
		})
	}
}

func (s *NotificationService) getTemplateForType(nType string) string {
	switch nType {
	case NotificationNewMessage:
		return "new_message"
	case NotificationItemSold:
		return "item_sold"
	case NotificationListingApproved:
		return "listing_approved"
	case NotificationListingRejected:
		return "listing_rejected"
	default:
		return "default"
	}
}

func (s *NotificationService) GetUserNotifications(ctx context.Context, userID uuid.UUID) ([]db.Notification, error) {
	return s.queries.GetUserNotifications(ctx, userID)
}

func (s *NotificationService) MarkAsRead(ctx context.Context, userID, notificationID uuid.UUID) error {
	_, err := s.queries.MarkNotificationAsRead(ctx, db.MarkNotificationAsReadParams{
		ID:     notificationID,
		UserID: userID,
	})
	return err
}

func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.queries.MarkAllNotificationsAsRead(ctx, userID)
}

func (s *NotificationService) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	return s.queries.GetUnreadNotificationCount(ctx, userID)
}
