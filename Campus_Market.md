# PROJECT_CONTEXT.md

# Campus Marketplace

## Project Overview

Campus Marketplace is a **peer-to-peer** web application: every student can list items and browse or message about others’ listings. There are no separate “buyer” or “seller” roles—only students trading with each other.

The platform addresses the challenges students face when using WhatsApp groups, Facebook posts, and informal channels to trade goods. It provides a centralized marketplace where verified students can create listings, browse products, message each other, and report suspicious activity.

**Not in scope:** user ratings, reviews, or reputation scores.

This project is being developed as a full-stack web application using **Next.js** for the frontend, **Golang (Gin)** for the backend, and **PostgreSQL** as the database.

Target completion time: 1 month.

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

- **Go** 1.21+
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
- First admin seeded from env when table is empty: `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Can: create new admins, view/block students, approve/reject sign-ups, manage categories
- Reports & moderation UI — **planned** (API exists; dashboard placeholder)

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

**Planned (not yet in API):**

- Student-to-student messaging about listings
- Report listing + admin review
- Product `condition` field (UI collects in listing wizard; not persisted yet)
- Meetup `location` field (UI only for now)
- Multiple images per listing (UI supports grid; API accepts one `image` file)

---

# Future Features (Not MVP)

Do NOT implement unless explicitly requested.

- Payments / deposit / escrow
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
│   ├── handlers/            # HTTP handlers + routes
│   ├── middleware/          # Auth, CORS
│   ├── models/              # DTOs & response mappers
│   ├── repository/
│   └── services/            # Auth, Product, Cloudinary
├── pkg/utils/
└── sqlc.yaml
```

**Not used:** GORM, MongoDB, local `uploads/` folder (images go to Cloudinary).

---

# Database Schema (core tables)

## users (students only)

- `id` (UUID), `username`, `email`, `password_hash`, `is_verified`, `student_id_url`, `account_status`, timestamps
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

- `id` (UUID), `seller_id`, `category_id`, `title`, `description`, `price` (NUMERIC), `image_url`, `status`, timestamps
- `status`: `available` | `sold` | `removed`

---

# API Endpoints (v1)

Base URL: `http://localhost:8080` (configurable via `NEXT_PUBLIC_API_URL`)

## Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
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

## Admin auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/auth/login` | Platform admin login → JWT `actor_type: admin` |

## Admin — platform JWT (`actor_type: admin`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/profile` | Current admin |
| POST | `/api/v1/admin/create` | Create new admin (requires existing admin) |
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
  "image_url": "string",
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
├── admin/            # Admin dashboard (users, categories, reports placeholder)
├── context/          # NotificationContext, ListingFormContext (wizard state)
├── types/
└── utils/api.ts
```

---

# Listing Workflow (UI)

Three-step flow aligned with designs:

1. **Upload photos** — `/sell` — at least one image (up to 4 slots in UI; API stores one primary image).
2. **Item details** — `/sell/details` — title, description, category, condition (UI state).
3. **Pricing & location** — `/sell/pricing` — price (FCFA), meetup location (UI state), review summary, publish.

On publish, frontend sends `POST /api/v1/products` with collected fields.

---

# Product Detail Page (UI)

Route: `/details/[id]`

Shows image, title, condition badge, price, location/time (mock or extended API later), description, category, **Listed by** card (poster name from `seller_name`; no ratings), safe-transaction info, **Message** CTA, and reserve/deposit CTA (visual only until payments are in scope).

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
