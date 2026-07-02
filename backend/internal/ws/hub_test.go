package ws

import (
	"fmt"
	"math/rand"
	"sync"
	"testing"
	"time"
)

// newTestClient builds a Client without a live *websocket.Conn. The hub's
// registry/broadcast/drop paths never touch Conn (only WritePump does, which we
// don't run here), so a nil Conn is safe for exercising Send/done concurrency.
func newTestClient(userID string, hub *Hub) *Client {
	return NewClient(userID, hub, nil)
}

// drain consumes from a client's Send channel until its done channel is closed.
// This keeps buffers from filling for clients we want to stay alive.
func drain(c *Client) {
	for {
		select {
		case <-c.Send:
		case <-c.done:
			return
		}
	}
}

// TestHub_ConcurrentBroadcastNoPanic is the flagship race test. It reproduces
// the shape of the original crash (send-on-closed-channel) by hammering the hub
// with concurrent broadcasts, drops (buffer-full + Unregister) and
// re-registrations of the same userIDs. With the current design (done channel,
// Send never closed) it must finish with no panic under `go test -race`.
func TestHub_ConcurrentBroadcastNoPanic(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	const numUsers = 25
	userIDs := make([]string, numUsers)
	for i := range userIDs {
		userIDs[i] = fmt.Sprintf("user-%d", i)
	}

	// Register an initial client per user. Half of them are drained (kept
	// healthy); the other half are intentionally NOT drained so their buffers
	// fill and broadcasts drop them.
	var drainWG sync.WaitGroup
	for i, uid := range userIDs {
		c := newTestClient(uid, hub)
		hub.Register <- c
		if i%2 == 0 {
			drainWG.Add(1)
			go func(cl *Client) {
				defer drainWG.Done()
				drain(cl)
			}(c)
		}
	}

	stop := make(chan struct{})
	var wg sync.WaitGroup

	// Broadcasters: many goroutines spamming overlapping userIDs.
	for g := 0; g < 8; g++ {
		wg.Add(1)
		go func(seed int64) {
			defer wg.Done()
			r := rand.New(rand.NewSource(seed))
			for {
				select {
				case <-stop:
					return
				default:
				}
				uid := userIDs[r.Intn(numUsers)]
				hub.BroadcastToUser(uid, Message{Type: "chat", ReceiverID: uid, Content: "hi"})
			}
		}(int64(g + 1))
	}

	// Also push through the Broadcast channel path in Run().
	wg.Add(1)
	go func() {
		defer wg.Done()
		r := rand.New(rand.NewSource(99))
		for {
			select {
			case <-stop:
				return
			default:
			}
			uid := userIDs[r.Intn(numUsers)]
			select {
			case hub.Broadcast <- Message{Type: "chat", ReceiverID: uid, Content: "x"}:
			case <-stop:
				return
			}
		}
	}()

	// Unregister churners: drop clients out from under the broadcasters.
	for g := 0; g < 3; g++ {
		wg.Add(1)
		go func(seed int64) {
			defer wg.Done()
			r := rand.New(rand.NewSource(seed + 1000))
			for {
				select {
				case <-stop:
					return
				default:
				}
				uid := userIDs[r.Intn(numUsers)]
				// Build a throwaway client with the same userID and unregister
				// it; dropClient's identity check must not tear down a mismatched
				// current client, and close() must be idempotent.
				c := newTestClient(uid, hub)
				hub.Unregister <- c
			}
		}(int64(g))
	}

	// Re-registration churners: re-register the same userIDs, causing the hub to
	// drop the OLD client (old.close()) while broadcasters may be mid-send.
	for g := 0; g < 3; g++ {
		wg.Add(1)
		go func(seed int64) {
			defer wg.Done()
			r := rand.New(rand.NewSource(seed + 2000))
			for {
				select {
				case <-stop:
					return
				default:
				}
				uid := userIDs[r.Intn(numUsers)]
				c := newTestClient(uid, hub)
				hub.Register <- c
				// Occasionally drain the new client to keep some alive.
				if r.Intn(2) == 0 {
					go drain(c)
				}
			}
		}(int64(g))
	}

	time.Sleep(300 * time.Millisecond)
	close(stop)
	wg.Wait()

	// If we got here without a panic, the concurrency fix holds.
}

// TestHub_DroppedClientBroadcastIsNoOp asserts that once a client is dropped, a
// subsequent BroadcastToUser to that user neither panics nor delivers (no-op),
// and IsOnline reports false.
func TestHub_DroppedClientBroadcastIsNoOp(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	uid := "solo-user"
	c := newTestClient(uid, hub)
	hub.Register <- c

	// Give Run() a moment to process the registration, then confirm online.
	waitFor(t, func() bool { return hub.IsOnline(uid) }, "client to register")

	// Drop the client via Unregister.
	hub.Unregister <- c
	waitFor(t, func() bool { return !hub.IsOnline(uid) }, "client to be dropped")

	// done must be closed after drop.
	select {
	case <-c.Done():
	case <-time.After(time.Second):
		t.Fatal("expected client.done to be closed after drop")
	}

	// Broadcasting to the dropped user must be a safe no-op.
	hub.BroadcastToUser(uid, Message{ReceiverID: uid, Content: "should not deliver"})

	// The buffered Send must have received nothing from the post-drop broadcast.
	select {
	case m := <-c.Send:
		t.Fatalf("expected no delivery to dropped client, got %+v", m)
	default:
	}
}

// TestHub_BufferFullDropsClient verifies that a client whose Send buffer is full
// gets dropped (not blocked, not panicked) by BroadcastToUser.
func TestHub_BufferFullDropsClient(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	uid := "greedy"
	c := newTestClient(uid, hub)
	hub.Register <- c
	waitFor(t, func() bool { return hub.IsOnline(uid) }, "client to register")

	// Fill the Send buffer (cap 256) without draining it.
	for i := 0; i < cap(c.Send); i++ {
		c.Send <- Message{Content: "fill"}
	}

	// The next broadcast finds a full buffer and must drop the client.
	hub.BroadcastToUser(uid, Message{ReceiverID: uid, Content: "overflow"})

	waitFor(t, func() bool { return !hub.IsOnline(uid) }, "full-buffer client to be dropped")

	select {
	case <-c.Done():
	case <-time.After(time.Second):
		t.Fatal("expected dropped client's done channel to be closed")
	}
}

func waitFor(t *testing.T, cond func() bool, what string) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if cond() {
			return
		}
		time.Sleep(2 * time.Millisecond)
	}
	t.Fatalf("timed out waiting for %s", what)
}
