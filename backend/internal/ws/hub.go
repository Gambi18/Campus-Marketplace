package ws

import "sync"

// Message represents a WebSocket message passed through the hub
type Message struct {
	Type         string      `json:"type"`
	ID           string      `json:"id,omitempty"`
	SenderID     string      `json:"sender_id,omitempty"`
	ReceiverID   string      `json:"receiver_id,omitempty"`
	ProductID    string      `json:"product_id,omitempty"`
	ProductTitle string      `json:"product_title,omitempty"`
	Content      string      `json:"content,omitempty"`
	SenderName   string      `json:"sender_name,omitempty"`
	CreatedAt    string      `json:"created_at,omitempty"`
	Payload      interface{} `json:"payload,omitempty"`
}

// Hub maintains all active WebSocket clients and broadcasts messages
type Hub struct {
	// registered clients mapped by userID
	clients map[string]*Client
	mu      sync.RWMutex

	// inbound messages from clients
	Broadcast chan Message

	// register/unregister requests
	Register   chan *Client
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		Broadcast:  make(chan Message, 256),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		// register new client
		case client := <-h.Register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()

		// unregister client
		case client := <-h.Unregister:
			h.dropClient(client.UserID, client)

		// broadcast message to receiver
		case message := <-h.Broadcast:
			h.mu.RLock()
			receiver, online := h.clients[message.ReceiverID]
			h.mu.RUnlock()

			if online {
				select {
				case receiver.Send <- message:
				default:
					// receiver buffer full — disconnect them
					h.dropClient(receiver.UserID, receiver)
				}
			}
		}
	}
}

// dropClient removes a client and closes its Send channel exactly once. The
// identity check (cur == client) under the write lock prevents two goroutines
// (e.g. the broadcast loop and BroadcastToUser) from double-closing the same
// channel, and prevents an unregister of a stale connection from closing a newer
// connection that reused the same userID.
func (h *Hub) dropClient(userID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if cur, ok := h.clients[userID]; ok && cur == client {
		delete(h.clients, userID)
		close(client.Send)
	}
}

// BroadcastToUser sends a message to a specific user if they are online
func (h *Hub) BroadcastToUser(userID string, message Message) {
	h.mu.RLock()
	client, online := h.clients[userID]
	h.mu.RUnlock()

	if online {
		select {
		case client.Send <- message:
		default:
			h.dropClient(userID, client)
		}
	}
}

// IsOnline checks if a user is currently connected
func (h *Hub) IsOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, ok := h.clients[userID]
	return ok
}