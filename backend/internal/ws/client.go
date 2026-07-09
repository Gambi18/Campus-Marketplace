package ws

import (
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

// PongWait is the read-deadline window exported for the reader goroutine
// (MessageHandler.readAndPersist lives in another package) so dead connections
// can be reaped instead of leaking goroutines forever.
const PongWait = pongWait

// Client represents a single connected WebSocket user
type Client struct {
	UserID string
	Hub    *Hub
	Conn   *websocket.Conn
	Send   chan Message

	// done is closed exactly once (via closeOnce) by the hub when the client is
	// dropped. Senders select on it so they never block on or panic writing to a
	// gone client. Send itself is NEVER closed — that is what previously caused
	// send-on-closed-channel panics that crashed the whole process.
	done      chan struct{}
	closeOnce sync.Once
}

// NewClient constructs a Client with its shutdown signalling wired up.
func NewClient(userID string, hub *Hub, conn *websocket.Conn) *Client {
	return &Client{
		UserID: userID,
		Hub:    hub,
		Conn:   conn,
		Send:   make(chan Message, 256),
		done:   make(chan struct{}),
	}
}

// Done returns the client's shutdown signal channel. It is closed once the hub
// drops the client.
func (c *Client) Done() <-chan struct{} { return c.done }

// close signals shutdown exactly once by closing done. Safe to call from
// multiple goroutines. Send is intentionally left open.
func (c *Client) close() {
	c.closeOnce.Do(func() { close(c.done) })
}

// TrySend attempts a non-blocking send to the client. It never blocks and never
// panics: if the client is gone or its buffer is full the message is dropped.
func (c *Client) TrySend(msg Message) {
	select {
	case c.Send <- msg:
	case <-c.done:
		// client gone — drop
	default:
		// buffer full — drop
	}
}

// Reading/persisting of inbound messages is handled by
// MessageHandler.readAndPersist (which enforces auth, the pay-to-chat gate and
// persistence). This file only owns the outbound WritePump.

// WritePump sends messages from the hub to the WebSocket connection
func (c *Client) WritePump() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("ws goroutine recovered: %v", r)
		}
	}()

	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case <-c.done:
			// Hub dropped this client — close the connection and exit.
			return

		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Send is never closed by the hub; treat a closed channel
				// defensively as a shutdown signal.
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Write message as JSON
			if err := c.Conn.WriteJSON(message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}

		case <-ticker.C:
			// Send ping to keep connection alive
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
