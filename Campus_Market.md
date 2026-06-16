# PROJECT_CONTEXT.md

# Campus Marketplace

## Project Overview

Campus Marketplace is a **peer-to-peer** web application: every student can list items and browse or message about others’ listings. There are no separate “buyer” or “seller” roles—only students trading with each other.

The platform addresses the challenges students face when using WhatsApp groups, Facebook posts, and informal channels to trade goods. It provides a centralized marketplace where verified students can create listings, browse products, message each other, and report suspicious activity.

**Not in scope:** user ratings, reviews, or reputation scores.

This project is being developed as a full-stack web application using **Next.js** for the frontend, **Golang (Gin)** for the backend, and **PostgreSQL** as the database.

Target completion time: 1 month.

---

# Project Progress

## Session: Payment System & Chat Gating (sprint)

### Backend
- **Payment handler** (`internal/handlers/payment_handler.go`): InitiatePayment, Webhook, CheckPaymentStatus, ConfirmDelivery, RejectDelivery, GetMyPurchases, GetMySales, GetAllHeldPayments
- **CamPay service** (`internal/services/campay_service.go`): getToken, collect (USSD prompt), transaction status, withdraw (payout to seller)
- **Receipt service** (`internal/services/receipt_service.go`): PDF receipt generation via gofpdf + Cloudinary upload
- **Chat gating** (`internal/handlers/message_handler.go`): WS `readAndPersist` rejects messages without active payment; REST `GetConversations` filters unpaid conversations out; `GetMessages` blocks access to unpaid conversations
- **Migration 010**: Added `phone_number` to `users` table
- **Migration 011**: Created `payments` table with escrow workflow
- `POST /api/v1/admin/create` moved outside admin-protected group to public

### Frontend
- **Product detail** (`app/details/[id]/page.tsx`): "Pay to Chat (price)" button replaces "Message" CTA; phone number modal; USSD status polling → auto-redirect to chat on success
- **Sell pricing** (`app/sell/pricing/page.tsx`): Dynamic 3% commission helper text showing net amount
- **Register** (`app/register/page.tsx`): Phone number input field added
- **Purchases page** (`app/purchases/page.tsx`): Purchase history with confirm-delivery and cancel-refund buttons, receipt download
- **Sales page** (`app/sales/page.tsx`): Sales history with fee breakdown and status badges
- **Navbar**: Added Purchases and Sales links
- **Payment types** (`app/types/payment.ts`): InitiatePaymentRequest, Payment, PaymentStatusResponse, ConfirmDeliveryResponse, etc.
- **Payment API helpers** (`app/utils/paymentApi.ts`): initiatePayment, checkPaymentStatus, confirmDelivery, rejectDelivery, getMyPurchases, getMySales, getReceipt
- **Notification type fix**: Renamed `Notification` → `AppNotification` to avoid browser API collision
- **date-fns**: Installed missing dependency
- **next.config.js**: Removed deprecated `swcMinify: true`

---

# Problem Statement

Students frequently need to buy or sell:

- Phones
- Laptops
- Electronics
- Clothing
- Furniture
- Academic materials

Current solutions are fragmented and unreliable.

Problems include:

- Difficulty finding products
- Lack of trust
- Poor organization
- Scam risks
- No verification system
- No search functionality

Campus Marketplace solves these issues by creating a student-focused trading platform.

---

# Project Goals

Primary goals:

1. Allow students to create and manage listings.
2. Enable browsing and searching of products.
3. Allow direct messaging between students about listings.
4. Provide a reporting system.
5. Support student verification.
6. Demonstrate production-style full-stack development.

---

# Technology Stack

## Frontend

- **Next.js** (App Router)
- **React** 18
- **TypeScript**
- **Tailwind CSS**
- **lucide-react** (icons)
- Fetch API for HTTP (see `app/utils/api.ts`)

Deployment: Vercel

## Backend

- **Go** 1.26+
- **Gin** web framework
- **sqlc** — type-safe SQL queries
- **golang-migrate** — database migrations
- **JWT** authentication (middleware)
- **bcrypt** password hashing
- **Cloudinary** — product image upload/storage

Deployment: Railway

## Database

- **PostgreSQL** (UUID primary keys for users/products)

---

# Platform model

- **Peer-to-peer:** All authenticated students can browse, list, and message. UI must not imply role switching (e.g. no “buyer mode” / “seller mode”).
- **No ratings:** Do not show stars, scores, or “X rating” anywhere in product or profile UI.
- **API naming:** `seller_id` / `seller_name` on products mean “who posted this listing” (database field names), not a fixed seller role.

---

# Actors (two separate account types)

Students and platform admins are **different tables** with **different login endpoints** and JWT `actor_type` claims (`student` | `admin`). The `users` table has no `role` column.

## Student (`users` table)

- Register / login via `/api/v1/auth/*`
- JWT `actor_type: student` required for marketplace routes (`/profile`, `/products`, etc.)
- `account_status`: `pending` | `approved` | `rejected` | `blocked`

## Platform admin (`admins` table)

- Login via `POST /api/v1/admin/auth/login` only (not student login)
- JWT `actor_type: admin` required for `/api/v1/admin/*`
- First admin can be created via public `POST /api/v1/admin/create`, or seeded from env when table is empty: `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Can: create new admins, view/block students, approve/reject sign-ups, manage categories, manage reports, view held payments in escrow

**Admin UI:** `/admin/login` → `/admin/users`, `/admin/categories`, `/admin/reports`

**Not in scope (differs from design mockups):** item listing approvals, analytics “generate reports” dashboard.

---

# MVP Scope

Must be completed:

**Authentication:**

- Register (`POST /api/v1/auth/register`)
- Login (`POST /api/v1/auth/login`)
- JWT-based authentication
- Profile (`GET /api/v1/profile`)

**Marketplace:**

- Create product (multipart form + image)
- View product list & single product
- Edit product
- Delete product
- Product image upload (single image via Cloudinary)
- Search by title
- Filter by category

**Notifications:**

- In-app notifications for messages and account status
- WebSocket-based real-time updates
- Email notifications (via queue)
- **Frontend:** Integrated Notification Center in Navbar, dedicated Notifications Page (`/notifications`).

**Categories:**

- Public list of categories
- Products by category

**Profile / listings:**

- User's own products (`GET /api/v1/my-products`)

**Payments:**

- Escrow payment via CamPay mobile money (MTN & Orange)
- Pay-to-chat: buyers must pay before messaging sellers
- Buyer confirms delivery → payment released to seller (minus 3% fee)
- Buyer cancels → automatic refund to buyer (minus 1% fee)
- PDF receipt generated and stored on Cloudinary
- Purchase history (`/my-purchases`) & sales history (`/my-sales`) pages

**UI-only (not yet in API):**

- Meetup `location` field (UI only for now)

---

# Future Features (Not MVP)

Do NOT implement unless explicitly requested.

- Delivery system
- Mobile app
- AI recommendations
- Auctions
- Location tracking
- Recommendation engine

> **Note:** Listing and product-detail screens may show deposit/reserve copy for future UX. Wire real payment only when explicitly requested.

---

# Backend Architecture (current)

```text
backend/
├── cmd/api/main.go          # Entry point
├── main.go
├── internal/
│   ├── config/
│   ├── db/
│   │   ├── migrations/      # SQL migrations
│   │   ├── queries/         # sqlc query definitions
│   │   └── sqlc/            # Generated Go code
│   ├── handlers/            # HTTP handlers + routes (`routes.go`)
│   ├── middleware/          # Auth, CORS
│   ├── models/              # DTOs & response mappers
│   ├── notification/        # Notification service + types
│   ├── repository/
│   ├── services/            # Auth, Product, Cloudinary, Admin seed, CamPay, Receipt
│   └── ws/                  # WebSocket hub + client
├── pkg/utils/
└── sqlc.yaml
```

**Not used:** GORM, MongoDB, local `uploads/` folder (images go to Cloudinary), ORMs (raw SQL via sqlc).

---

# Database Schema (core tables)

## users (students only)

- `id` (UUID), `username`, `email`, `phone_number`, `password_hash`, `is_verified`, `student_id_url`, `account_status`, timestamps
- `account_status`: `pending` | `approved` | `rejected` | `blocked`
- No `role` column — students are the only kind of user in this table

## admins (platform operators)

- `id` (UUID), `username`, `email`, `password_hash`, timestamps
- Separate credentials from students; not linked to `users`

## notifications

- `id` (UUID), `user_id` (FK), `type`, `title`, `message`, `is_read`, `created_at`, `read_at`, `metadata` (JSONB), `link`

## email_queue

- `id` (UUID), `notification_id` (FK), `recipient_email`, `subject`, `template_name`, `payload` (JSONB), `status`, `attempts`, `created_at`, `sent_at`

## notification_preferences

- `user_id` (PK), `email_messages`, `email_offers`, `email_sales`, `email_marketing`, `inapp_messages`, `inapp_offers`

## categories

- `id` (SERIAL), `name`, `description`
- Seeded: Electronics, Fashion & Accessories, Academic Materials, Furniture & Home, Sports & Fitness, Others

## products

- `id` (UUID), `seller_id`, `category_id`, `title`, `description`, `price` (NUMERIC), `condition` (VARCHAR), `image_url_1`..`image_url_4` (TEXT), `status`, timestamps
- `status`: `available` | `sold` | `removed` | `in_escrow`

## payments

- `id` (UUID), `buyer_id` (FK), `seller_id` (FK), `product_id` (FK), `amount` (NUMERIC), `platform_fee` (NUMERIC), `net_amount` (NUMERIC), `phone_number`, `operator`, `reference`, `withdraw_reference`, `status` (`pending` | `held` | `released` | `refunded`), `receipt_number`, `receipt_pdf_url`, timestamps

---

# API Endpoints (v1)

Base URL: `http://localhost:8080` (configurable via `NEXT_PUBLIC_API_URL`)

## Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/webhook/campay` | CamPay payment webhook |
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/categories` | List categories |
| GET | `/api/v1/categories/:id/products` | Products in category |
| GET | `/api/v1/products` | All products |
| GET | `/api/v1/products/search?q=` | Search by title |
| GET | `/api/v1/products/:id` | Product by ID |

## Protected — student JWT (`actor_type: student`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/profile` | Current student |
| GET | `/api/v1/my-products` | Current user's listings |
| POST | `/api/v1/products` | Create product (multipart) |
| PUT | `/api/v1/products/:id` | Update product (multipart) |
| PATCH | `/api/v1/products/:id/status` | Update status JSON `{ "status": "..." }` |
| DELETE | `/api/v1/products/:id` | Delete product |
| POST | `/api/v1/reports` | Report a listing |
| GET | `/api/v1/my-reports` | Current user's reports |
| GET | `/api/v1/ws` | WebSocket connection for real-time updates |
| GET | `/api/v1/conversations` | List conversations |
| GET | `/api/v1/conversations/:product_id/:user_id` | Get messages for a conversation |
| GET | `/api/v1/unread-count` | Unread message count |
| POST | `/api/v1/payments/initiate` | Initiate payment via CamPay mobile money |
| GET | `/api/v1/payments/:id/status` | Check payment status |
| POST | `/api/v1/payments/:id/confirm` | Confirm delivery & release payment to seller |
| POST | `/api/v1/payments/:id/reject` | Cancel & refund (1% fee) |
| GET | `/api/v1/payments/:id/receipt` | Get receipt PDF URL |
| GET | `/api/v1/my-purchases` | Current user's purchases |
| GET | `/api/v1/my-sales` | Current user's sales |

## Admin auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/auth/login` | Platform admin login → JWT `actor_type: admin` |
| POST | `/api/v1/admin/create` | Create a new admin (public, no auth required) |

## Admin — platform JWT (`actor_type: admin`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/profile` | Current admin |
| GET | `/api/v1/admin/users` | All students |
| GET | `/api/v1/admin/pending-users` | Users awaiting ID verification |
| PATCH | `/api/v1/admin/users/:id/approve` | Approve sign-up |
| PATCH | `/api/v1/admin/users/:id/reject` | Reject sign-up |
| PATCH | `/api/v1/admin/users/:id/block` | Block account (`account_status=blocked`) |
| POST | `/api/v1/admin/categories` | Create category |
| PUT | `/api/v1/admin/categories/:id` | Update category |
| DELETE | `/api/v1/admin/categories/:id` | Delete category |
| GET | `/api/v1/admin/reports` | List reports (UI planned) |
| GET | `/api/v1/admin/reports/:id` | Report detail (UI planned) |
| PATCH | `/api/v1/admin/reports/:id/status` | Update report status (UI planned) |
| GET | `/api/v1/admin/payments/held` | List all held payments in escrow |

## Notifications — student JWT (`actor_type: student`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/notifications` | List user notifications |
| GET | `/api/v1/notifications/unread-count` | Unread notification count |
| PATCH | `/api/v1/notifications/:id/read` | Mark notification as read |
| POST | `/api/v1/notifications/read-all` | Mark all as read |

### User `account_status` values

`pending` → `approved` | `rejected` | `blocked`. Login is denied for `pending`, `rejected`, and `blocked`.

### Create / update product (multipart form)

Fields: `title`, `description`, `price`, `category_id`, optional `image` (file).

Response shape (`ProductResponse`):

```json
{
  "id": "uuid",
  "seller_id": "uuid",
  "seller_name": "string",
  "category_id": 1,
  "category_name": "string",
  "title": "string",
  "description": "string",
  "price": "string",
  "condition": "string",
  "image_url_1": "string",
  "image_url_2": "string",
  "image_url_3": "string",
  "image_url_4": "string",
  "status": "available",
  "created_at": "timestamp"
}
```

---

# Frontend Architecture (current)

```text
frontend/app/
├── components/       # Navbar, Footer, Button, Input, Card, NotificationCenter, etc.
├── sell/             # 3-step listing wizard
│   ├── page.tsx           # Step 1: Upload photos
│   ├── details/page.tsx   # Step 2: Item details
│   └── pricing/page.tsx   # Step 3: Pricing & location
├── details/[id]/     # Product detail page
├── notifications/    # Notifications list page
├── admin/            # Admin dashboard (users, categories, reports)
├── login/            # Login page
├── register/         # Registration page
├── mylistings/       # Current user's listings
├── purchases/        # Purchase history with confirm/reject actions
├── sales/            # Sales history with fee breakdown
├── context/          # NotificationContext, ListingFormContext (wizard state)
├── images/           # Static images
├── types/            # TypeScript type definitions
└── utils/            # API helpers (api.ts, adminApi.ts, format.ts)
```

---

# Listing Workflow (UI)

Three-step flow aligned with designs:

1. **Upload photos** — `/sell` — at least one image (up to 4 slots; API stores up to 4 images in `image_url_1`..`image_url_4`).
2. **Item details** — `/sell/details` — title, description, category, condition (persisted to DB).
3. **Pricing & location** — `/sell/pricing` — price (FCFA), meetup location (UI state, not persisted), review summary, publish.

On publish, frontend sends `POST /api/v1/products` with collected fields.

---

# Product Detail Page (UI)

Route: `/details/[id]`

Shows image, title, condition badge, price, location/time (mock or extended API later), description, category, **Listed by** card (poster name from `seller_name`; no ratings), safe-transaction info, **Pay to Chat** button with phone-number modal. Payment required before messaging the seller.

---

# Documentation

**Rule:** Keep docs updated whenever code, APIs, routes, schema, or workflows change—in the same PR or task, not as a follow-up.

| File | Purpose |
|------|---------|
| `Campus_Market.md` | Project context (this file): scope, stack, API, schema, UI flows |
| `backend/README.md` | Backend setup and structure |
| `frontend/README.md` | Frontend setup and routes |
| `backend/.env.example` | Required environment variables |

Agents and contributors should treat stale documentation as a defect. When adding features, update the matching section here (endpoints table, schema, frontend routes, or “UI-only” notes).

---
