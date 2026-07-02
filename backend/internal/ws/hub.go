package ws

import (
	"log"
	"sync"
)

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
	defer func() {
		if r := recover(); r != nil {
			log.Printf("ws goroutine recovered: %v", r)
		}
	}()

	for {
		select {
		// register new client
		case client := <-h.Register:
			h.mu.Lock()
			// If a client already exists for this user, drop the OLD one so its
			// goroutines/fd don't leak, then store the new connection.
			if old, ok := h.clients[client.UserID]; ok && old != client {
				old.close()
			}
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
				case <-receiver.done:
					// receiver gone — drop
				default:
					// receiver buffer full — disconnect them
					h.dropClient(receiver.UserID, receiver)
				}
			}
		}
	}
}

// dropClient removes a client from the registry and signals its shutdown exactly
// once via close(client.done). The identity check (cur == client) under the
// write lock prevents an unregister of a stale connection from tearing down a
// newer connection that reused the same userID. Send is NEVER closed here — the
// old design closed Send, which raced with concurrent senders and caused
// send-on-closed-channel panics that crashed the process.
func (h *Hub) dropClient(userID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if cur, ok := h.clients[userID]; ok && cur == client {
		delete(h.clients, userID)
	}
	// Signal shutdown regardless of map identity: close() is idempotent and the
	// goroutines watching done must always be released.
	client.close()
}

// BroadcastToUser sends a message to a specific user if they are online
func (h *Hub) BroadcastToUser(userID string, message Message) {
	h.mu.RLock()
	client, online := h.clients[userID]
	h.mu.RUnlock()

	if online {
		select {
		case client.Send <- message:
		case <-client.done:
			// client gone — drop
		default:
			// buffer full — disconnect them
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
