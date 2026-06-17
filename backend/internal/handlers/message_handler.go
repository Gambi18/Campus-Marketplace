package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/notification"
	"campus-marketplace/internal/ws"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins 
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type MessageHandler struct {
	queries             *db.Queries
	hub                 *ws.Hub
	notificationService *notification.NotificationService
}

func NewMessageHandler(queries *db.Queries, hub *ws.Hub, notificationService *notification.NotificationService) *MessageHandler {
	return &MessageHandler{
		queries:             queries,
		hub:                 hub,
		notificationService: notificationService,
	}
}

//  WEBSOCKET ENDPOINT
func (h *MessageHandler) HandleWebSocket(c *gin.Context) {
    userIDStr := c.GetString("user_id")
    if userIDStr == "" {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    userID, err := uuid.Parse(userIDStr)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
        return
    }

    // Fetch username from DB
    user, err := h.queries.GetUserByID(context.Background(), userID)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
        return
    }

    // Upgrade HTTP to WebSocket
    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Printf("WebSocket upgrade error: %v", err)
        return
    }

    client := &ws.Client{
        UserID: userIDStr,
        Hub:    h.hub,
        Conn:   conn,
        Send:   make(chan ws.Message, 256),
    }

    h.hub.Register <- client
    log.Printf("User %s connected via WebSocket", user.Username)

    go h.readAndPersist(client)
    go client.WritePump()
}

// readAndPersist reads messages, saves to DB, then broadcasts
func (h *MessageHandler) readAndPersist(client *ws.Client) {
	defer func() {
		h.hub.Unregister <- client
		client.Conn.Close()
	}()

	client.Conn.SetReadLimit(4096)

	for {
		var msg ws.Message
		if err := client.Conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err,
				websocket.CloseGoingAway,
				websocket.CloseAbnormalClosure,
			) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Set sender from authenticated user
		msg.SenderID = client.UserID

		// Parse UUIDs
		senderID, err := uuid.Parse(msg.SenderID)
		if err != nil {
			log.Printf("Invalid sender ID: %v", err)
			continue
		}

		receiverID, err := uuid.Parse(msg.ReceiverID)
		if err != nil {
			log.Printf("Invalid receiver ID: %v", err)
			continue
		}
		productID, err := uuid.Parse(msg.ProductID)
		if err != nil {
			log.Printf("Invalid product ID: %v", err)
			continue
		}
		//fetch product
		product, err := h.queries.GetProductByID(context.Background(), productID)
		if err != nil {
			log.Printf("Error getting product: %v", err)
			continue
		}

		// Save message to PostgreSQL
		saved, err := h.queries.CreateMessage(context.Background(),  db.CreateMessageParams{
			SenderID:   senderID,
			ReceiverID: receiverID,
			ProductID:  productID,
			Content:    msg.Content,
		})
		if err != nil {
			log.Printf("Error saving message: %v", err)
			continue
		}

		// Get sender username
		sender, err := h.queries.GetUserByID(context.Background(), senderID)
		if err != nil {
			log.Printf("Error getting sender: %v", err)
			continue
		}

		// Build broadcast message
		broadcastMsg := ws.Message{
			Type:       "chat",
			SenderID:   saved.SenderID.String(),
			ReceiverID: saved.ReceiverID.String(),
			ProductID:  saved.ProductID.String(),
			ProductTitle: product.Title,
			Content:    saved.Content,
			SenderName: sender.Username,
			CreatedAt:  saved.CreatedAt.String(),
		}

		// Broadcast to both receiver and sender
		h.hub.BroadcastToUser(broadcastMsg.ReceiverID, broadcastMsg)
		h.hub.BroadcastToUser(broadcastMsg.SenderID, broadcastMsg)

		// Create in-app notification for the receiver
		_, _ = h.notificationService.Create(
			context.Background(),
			receiverID,
			notification.NotificationNewMessage,
			"New Message",
			fmt.Sprintf("%s sent you a message regarding %s", sender.Username, product.Title),
			notification.NotificationMetadata{
				"sender_id":  senderID.String(),
				"product_id": productID.String(),
				"chat_id":    saved.ID.String(),
			},
			fmt.Sprintf("/conversations/%s/%s", productID.String(), senderID.String()),
		)
	}
}

//REST ENDPOINTS 

func (h *MessageHandler) CreateMessageREST(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	senderID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	var req models.CreateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	receiverID, err := uuid.Parse(req.ReceiverID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid receiver ID"})
		return
	}

	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	if senderID == receiverID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot message yourself"})
		return
	}

	product, err := h.queries.GetProductByID(c.Request.Context(), productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	// Verify receiver exists
	_, err = h.queries.GetUserByID(c.Request.Context(), receiverID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "receiver not found"})
		return
	}

	saved, err := h.queries.CreateMessage(c.Request.Context(), db.CreateMessageParams{
		SenderID:   senderID,
		ReceiverID: receiverID,
		ProductID:  productID,
		Content:    req.Content,
	})
	if err != nil {
		log.Printf("Error saving message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save message"})
		return
	}

	sender, err := h.queries.GetUserByID(c.Request.Context(), senderID)
	if err != nil {
		log.Printf("Error getting sender: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not get sender"})
		return
	}

	// Broadcast via WebSocket
	broadcastMsg := ws.Message{
		Type:         "chat",
		SenderID:     saved.SenderID.String(),
		ReceiverID:   saved.ReceiverID.String(),
		ProductID:    saved.ProductID.String(),
		ProductTitle: product.Title,
		Content:      saved.Content,
		SenderName:   sender.Username,
		CreatedAt:    saved.CreatedAt.String(),
	}
	h.hub.BroadcastToUser(broadcastMsg.ReceiverID, broadcastMsg)
	h.hub.BroadcastToUser(broadcastMsg.SenderID, broadcastMsg)

	// Notification for receiver
	_, _ = h.notificationService.Create(
		c.Request.Context(),
		receiverID,
		notification.NotificationNewMessage,
		"New Message",
		fmt.Sprintf("%s sent you a message regarding %s", sender.Username, product.Title),
		notification.NotificationMetadata{
			"sender_id":  senderID.String(),
			"product_id": productID.String(),
		},
		fmt.Sprintf("/conversations/%s/%s", productID.String(), senderID.String()),
	)

	c.JSON(http.StatusCreated, gin.H{"message": models.MessageResponse{
		ID:         saved.ID.String(),
		SenderID:   saved.SenderID.String(),
		SenderName: sender.Username,
		ReceiverID: saved.ReceiverID.String(),
		ProductID:  saved.ProductID.String(),
		Content:    saved.Content,
		IsRead:     saved.IsRead,
		CreatedAt:  saved.CreatedAt.String(),
	}})
}

func (h *MessageHandler) GetConversations(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	conversations, err := h.queries.GetConversations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch conversations"})
		return
	}

	response := make([]models.ConversationResponse, 0, len(conversations))
	for _, conv := range conversations {
		response = append(response, models.ConversationResponse{
			ID:           conv.ID.String(),
			SenderID:     conv.SenderID.String(),
			SenderName:   conv.SenderName,
			ReceiverID:   conv.ReceiverID.String(),
			ProductID:    conv.ProductID.String(),
			ProductTitle: conv.ProductTitle,
			ProductImage: conv.ProductImage,
			Content:      conv.Content,
			IsRead:       conv.IsRead,
			CreatedAt:    conv.CreatedAt.String(),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"conversations": response,
		"count":         len(response),
	})
}

func (h *MessageHandler) GetMessages(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	// Get other user ID and product ID from URL params
	otherUserID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	productID, err := uuid.Parse(c.Param("product_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	// Get messages
	messages, err := h.queries.GetMessagesByConversation(c.Request.Context(), db.GetMessagesByConversationParams{
		SenderID:   userID,
		ReceiverID: otherUserID,
		ProductID:  productID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch messages"})
		return
	}

	// Mark messages as read
	_ = h.queries.MarkMessagesAsRead(c.Request.Context(), db.MarkMessagesAsReadParams{
		ProductID:  productID,
		SenderID:   otherUserID,
		ReceiverID: userID,
	})

	response := make([]models.MessageResponse, len(messages))
	for i, m := range messages {
		response[i] = models.MessageResponse{
			ID:         m.ID.String(),
			SenderID:   m.SenderID.String(),
			SenderName: m.SenderName,
			ReceiverID: m.ReceiverID.String(),
			ProductID:  m.ProductID.String(),
			Content:    m.Content,
			IsRead:     m.IsRead,
			CreatedAt:  m.CreatedAt.String(),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": response,
		"count":    len(response),
	})
}

func (h *MessageHandler) GetUnreadCount(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	count, err := h.queries.GetUnreadCount(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not get unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}