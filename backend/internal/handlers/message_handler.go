package handlers

import (
	"context"
	"fmt"
	"html"
	"log"
	"net/http"
	"net/url"
	"time"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/middleware"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/notification"
	"campus-marketplace/internal/platform/httpx"
	"campus-marketplace/internal/ws"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type MessageHandler struct {
	queries             *db.Queries
	hub                 *ws.Hub
	notificationService *notification.NotificationService
	upgrader            websocket.Upgrader
}

func NewMessageHandler(queries *db.Queries, hub *ws.Hub, notificationService *notification.NotificationService, allowedOrigins []string) *MessageHandler {
	return &MessageHandler{
		queries:             queries,
		hub:                 hub,
		notificationService: notificationService,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			// Reject cross-site WebSocket connections. Browsers always send an
			// Origin header, so an empty Origin (non-browser client) is allowed,
			// but a present-but-untrusted origin is refused.
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				return origin == "" || middleware.IsAllowedOrigin(allowedOrigins, origin)
			},
		},
	}
}

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

	user, err := h.queries.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := ws.NewClient(userIDStr, h.hub, conn)

	h.hub.Register <- client
	log.Printf("User %s connected via WebSocket", user.Username)

	go h.readAndPersist(client)
	go client.WritePump()
}

// readAndPersist reads messages off the socket and hands each one to
// persistAndBroadcast. The read loop itself stays free of DB work.
func (h *MessageHandler) readAndPersist(client *ws.Client) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("ws goroutine recovered: %v", r)
		}
	}()
	defer func() {
		h.hub.Unregister <- client
		client.Conn.Close()
	}()

	client.Conn.SetReadLimit(4096)

	// Read deadline + pong handler so dead connections are reaped instead of
	// leaking this goroutine forever. Each pong pushes the deadline forward.
	client.Conn.SetReadDeadline(time.Now().Add(ws.PongWait))
	client.Conn.SetPongHandler(func(string) error {
		client.Conn.SetReadDeadline(time.Now().Add(ws.PongWait))
		return nil
	})

	const maxMessagesPerWindow = 10
	const rateWindow = 10 * time.Second

	// This runs in a single goroutine per connection, so plain ints suffice —
	// no mutex needed.
	msgCount := 0
	windowStart := time.Now()

	for {
		// Always read the inbound frame first. This blocks on socket
		// backpressure, so an abusive client cannot make us spin a CPU core.
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

		if time.Since(windowStart) > rateWindow {
			msgCount = 0
			windowStart = time.Now()
		}
		msgCount++
		if msgCount > maxMessagesPerWindow {
			// Frame already read+discarded above; just warn and drop it.
			log.Printf("WebSocket rate limit exceeded for user %s", client.UserID)
			client.TrySend(ws.Message{
				Type:    "error",
				Content: "rate limit exceeded, please slow down",
			})
			continue
		}

		// Never trust the client's self-identified sender
		msg.SenderID = client.UserID

		if len(msg.Content) > 5000 {
			msg.Content = msg.Content[:5000]
		}
		msg.Content = html.EscapeString(msg.Content)

		h.persistAndBroadcast(msg)
	}
}

// persistAndBroadcast validates, gates, stores and fans out a single chat
// message. It uses its own bounded context so a slow query cannot wedge the
// connection's read loop indefinitely.
func (h *MessageHandler) persistAndBroadcast(msg ws.Message) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	senderID, err := uuid.Parse(msg.SenderID)
	if err != nil {
		log.Printf("Invalid sender ID: %v", err)
		return
	}
	receiverID, err := uuid.Parse(msg.ReceiverID)
	if err != nil {
		log.Printf("Invalid receiver ID: %v", err)
		return
	}
	productID, err := uuid.Parse(msg.ProductID)
	if err != nil {
		log.Printf("Invalid product ID: %v", err)
		return
	}

	// Pay-to-chat gate: messaging is only allowed once an escrow payment exists
	// between the two users for this product.
	if !h.canChat(ctx, productID, senderID, receiverID) {
		log.Printf("Blocked message: no active payment between %s and %s for product %s", senderID, receiverID, productID)
		return
	}

	product, err := h.queries.GetProductByID(ctx, productID)
	if err != nil {
		log.Printf("Error getting product: %v", err)
		return
	}

	saved, err := h.queries.CreateMessage(ctx, db.CreateMessageParams{
		SenderID:   senderID,
		ReceiverID: receiverID,
		ProductID:  productID,
		Content:    msg.Content,
	})
	if err != nil {
		log.Printf("Error saving message: %v", err)
		return
	}

	sender, err := h.queries.GetUserByID(ctx, senderID)
	if err != nil {
		log.Printf("Error getting sender: %v", err)
		return
	}

	broadcastMsg := ws.Message{
		Type:         "chat",
		ID:           saved.ID.String(),
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

	_, _ = h.notificationService.Create(
		ctx,
		receiverID,
		notification.NotificationNewMessage,
		"New Message",
		fmt.Sprintf("%s sent you a message regarding %s", sender.Username, product.Title),
		notification.NotificationMetadata{
			"sender_id":  senderID.String(),
			"product_id": productID.String(),
			"chat_id":    saved.ID.String(),
		},
		fmt.Sprintf("/conversations/%s?user=%s&name=%s", productID.String(), senderID.String(), url.QueryEscape(sender.Username)),
	)
}

// canChat reports whether two users are allowed to exchange messages about a
// product (i.e. an escrow payment exists between them). Used by both the
// WebSocket and REST message paths.
func (h *MessageHandler) canChat(ctx context.Context, productID, userA, userB uuid.UUID) bool {
	ok, err := h.queries.HasActivePayment(ctx, db.HasActivePaymentParams{
		ProductID: productID,
		BuyerID:   userA,
		SellerID:  userB,
	})
	if err != nil {
		log.Printf("Error checking pay-to-chat gate: %v", err)
		return false
	}
	return ok
}

func (h *MessageHandler) CreateMessageREST(c *gin.Context) {
	senderID, ok := httpx.CurrentUserID(c)
	if !ok {
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

	_, err = h.queries.GetUserByID(c.Request.Context(), receiverID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "receiver not found"})
		return
	}

	// Pay-to-chat gate: require an escrow payment between the two users.
	if !h.canChat(c.Request.Context(), productID, senderID, receiverID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "payment required before you can message about this item"})
		return
	}

	sanitizedContent := html.EscapeString(req.Content)
	if len(sanitizedContent) > 5000 {
		sanitizedContent = sanitizedContent[:5000]
	}

	saved, err := h.queries.CreateMessage(c.Request.Context(), db.CreateMessageParams{
		SenderID:   senderID,
		ReceiverID: receiverID,
		ProductID:  productID,
		Content:    sanitizedContent,
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

	broadcastMsg := ws.Message{
		Type:         "chat",
		ID:           saved.ID.String(),
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
		fmt.Sprintf("/conversations/%s?user=%s&name=%s", productID.String(), senderID.String(), url.QueryEscape(sender.Username)),
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
	userID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	conversations, err := h.queries.GetConversations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch conversations"})
		return
	}

	response := make([]models.ConversationResponse, 0, len(conversations))
	for _, conv := range conversations {
		// The conversation partner is whichever side isn't the requesting user.
		// conv.OtherUserName is resolved server-side by the query (join on the
		// partner's user row), so no per-row GetUserByID lookup is needed.
		otherUserID := conv.SenderID
		if conv.SenderID == userID {
			otherUserID = conv.ReceiverID
		}
		otherUserName := conv.OtherUserName
		response = append(response, models.ConversationResponse{
			ID:            conv.ID.String(),
			SenderID:      conv.SenderID.String(),
			SenderName:    conv.SenderName,
			ReceiverID:    conv.ReceiverID.String(),
			OtherUserID:   otherUserID.String(),
			OtherUserName: otherUserName,
			ProductID:     conv.ProductID.String(),
			ProductTitle:  conv.ProductTitle,
			ProductImage:  conv.ProductImage,
			Content:       conv.Content,
			IsRead:        conv.IsRead,
			UnreadCount:   conv.UnreadCount,
			CreatedAt:     conv.CreatedAt.String(),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"conversations": response,
		"count":         len(response),
	})
}

func (h *MessageHandler) GetMessages(c *gin.Context) {
	userID, ok := httpx.CurrentUserID(c)
	if !ok {
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

	// Pay-to-chat gate: history is only visible once a payment exists between
	// the two users. The frontend keys its "Payment Required" screen off this.
	if !h.canChat(c.Request.Context(), productID, userID, otherUserID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "payment required to view this conversation"})
		return
	}

	messages, err := h.queries.GetMessagesByConversation(c.Request.Context(), db.GetMessagesByConversationParams{
		SenderID:   userID,
		ReceiverID: otherUserID,
		ProductID:  productID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch messages"})
		return
	}

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
	userID, ok := httpx.CurrentUserID(c)
	if !ok {
		return
	}

	count, err := h.queries.GetUnreadCount(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not get unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}
