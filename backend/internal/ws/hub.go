package ws

import "sync"

// Message represents a WebSocket message passed through the hub
type Message struct {
	SenderID   string `json:"sender_id"`
	ReceiverID string `json:"receiver_id"`
	ProductID  string `json:"product_id"`
	ProductTitle string `json:"product_title"`
	Content    string `json:"content"`
	SenderName string `json:"sender_name"`
	CreatedAt  string `json:"created_at"`
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
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.Send)
			}
			h.mu.Unlock()

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
					h.mu.Lock()
					delete(h.clients, receiver.UserID)
					close(receiver.Send)
					h.mu.Unlock()
				}
			}
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