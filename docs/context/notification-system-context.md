# Notification System Context

## Overview

The Campus Marketplace notification architecture is designed around a unified notification service that supports multiple delivery channels:

- In-App Notifications
- Email Notifications
- Future SMS Notifications
- Future Push Notifications

The system should follow an event-driven design where business events generate notifications, and notification delivery is handled independently of business logic.

---

# High-Level Architecture

```text
Event Happens
      ↓
Notification Created
      ↓
 ┌───────────────┐
 │ Notification  │
 │    Service    │
 └───────────────┘
      ↓
 ┌───────────────┬───────────────┐
 │               │               │
 ▼               ▼               ▼
In-App        Email          Future SMS
```

Business modules should never send emails directly.

Instead:

1. Business event occurs.
2. Notification record is created.
3. Delivery channels process the notification.

---

# Database Design

## notifications

Master notification table used by the entire platform.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP NULL,
    metadata JSONB
);
```

Example:

```json
{
  "id": "123",
  "user_id": "456",
  "type": "NEW_MESSAGE",
  "title": "New Message",
  "message": "Jane sent you a message regarding MacBook Pro",
  "metadata": {
    "chat_id": "999",
    "listing_id": "111"
  }
}
```

---

## email_queue

Email delivery queue.

```sql
CREATE TABLE email_queue (
    id UUID PRIMARY KEY,
    notification_id UUID,
    recipient_email VARCHAR(255),
    subject VARCHAR(255),
    template_name VARCHAR(100),
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP NULL
);
```

Statuses:

```text
pending
processing
sent
failed
```

---

## notification_preferences

```sql
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY,

    email_messages BOOLEAN DEFAULT TRUE,
    email_offers BOOLEAN DEFAULT TRUE,
    email_sales BOOLEAN DEFAULT TRUE,
    email_marketing BOOLEAN DEFAULT FALSE,

    inapp_messages BOOLEAN DEFAULT TRUE,
    inapp_offers BOOLEAN DEFAULT TRUE
);
```

---

# Notification Types

```go
const (
    NotificationNewMessage       = "NEW_MESSAGE"
    NotificationNewOffer         = "NEW_OFFER"
    NotificationOfferAccepted    = "OFFER_ACCEPTED"
    NotificationItemSold         = "ITEM_SOLD"
    NotificationListingApproved  = "LISTING_APPROVED"
    NotificationListingRejected  = "LISTING_REJECTED"
    NotificationPasswordReset    = "PASSWORD_RESET"
    NotificationEmailVerification = "EMAIL_VERIFICATION"
)
```

---

# Backend Structure

```text
internal/
│
├── notification/
│   │
│   ├── service.go
│   ├── repository.go
│   ├── worker.go
│   ├── types.go
│   │
│   ├── email/
│   │   ├── sender.go
│   │   ├── templates.go
│   │   └── resend.go
│   │
│   ├── handlers/
│   │   ├── message.go
│   │   ├── offer.go
│   │   └── auth.go
│   │
│   └── templates/
│       ├── welcome.html
│       ├── new_message.html
│       ├── item_sold.html
│       └── password_reset.html
```

---

# Core Models

## Notification

```go
type Notification struct {
    ID        uuid.UUID
    UserID    uuid.UUID

    Type      string

    Title     string
    Message   string

    IsRead    bool

    Metadata  map[string]interface{}

    CreatedAt time.Time
}
```

## EmailJob

```go
type EmailJob struct {
    ID             uuid.UUID
    NotificationID uuid.UUID

    RecipientEmail string

    Subject string

    Template string

    Payload map[string]interface{}

    Status string
}
```

---

# In-App Notification Flow

Example:

```text
Charles sends message
        ↓
Jane receives notification
```

Backend:

```go
notificationService.Create(
    jane.ID,
    NotificationNewMessage,
    "New Message",
    "Charles sent you a message",
    metadata,
)
```

Frontend notification center:

```text
🔔 Notifications

Charles sent you a message
Your offer was accepted
Laptop listing approved
```

API Endpoints:

```http
GET /api/v1/notifications
GET /api/v1/notifications/unread-count
PATCH /api/v1/notifications/:id/read
```

---

# Real-Time Notifications

Recommended technology:

```text
gorilla/websocket
```

Flow:

```text
Buyer sends message
      ↓
Message saved
      ↓
Notification created
      ↓
WebSocket event emitted
      ↓
Notification bell updates instantly
```

Example payload:

```json
{
  "type": "notification",
  "notification": {
    "title": "New Message",
    "message": "Charles sent you a message"
  }
}
```

---

# Email Notification Flow

Example:

```text
Save Message
      ↓
Create Notification
      ↓
Create Email Job
      ↓
Return API Response
```

Worker Process:

```text
Every few seconds
      ↓
Find Pending Emails
      ↓
Render Template
      ↓
Send Through Provider
      ↓
Mark Sent
```

Recommended provider:

- Resend

---

# Email Templates

## new_message.html

```html
<h2>You have a new message</h2>

<p>{{ .Sender }} sent you a message regarding:</p>

<strong>{{ .Listing }}</strong>

<p>Log in to reply.</p>
```

## item_sold.html

```html
<h2>Congratulations 🎉</h2>

<p>Your item has been sold.</p>

<strong>{{ .Listing }}</strong>
```

---

# Phase-Based Implementation Plan

## Phase 1

- Email verification
- Welcome emails
- Password reset emails
- Resend integration

## Phase 2

- New message notifications
- New offer notifications
- Item sold notifications

## Phase 3

- Notification preferences
- Email template management
- Digest emails

## Phase 4

- In-app notification center
- Notification history page
- Real-time updates

## Phase 5

- Push notifications
- SMS notifications

---

# Final Architecture

```text
PostgreSQL
│
├── notifications
├── email_queue
└── notification_preferences

Notification Service
│
├── In-App Notifications
├── Email Notifications
└── WebSocket Events

Frontend
│
├── Notification Bell
├── Notification Page
└── Real-Time Updates
```

This architecture should serve as the foundation for all notification functionality across Campus Marketplace and future marketplace products.