# PROJECT_CONTEXT.md

# Campus Marketplace

## Project Overview

Campus Marketplace is a web application that enables university students to buy and sell items within a trusted campus community.

The platform addresses the challenges students face when using WhatsApp groups, Facebook posts, and informal channels to trade goods. It provides a centralized marketplace where verified students can create listings, browse products, communicate with sellers, and report suspicious activity.

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
3. Allow communication between buyers and sellers.
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

# User Roles

## Student

Can:

- Register
- Login
- View products
- Create listings (authenticated)
- Edit own listings
- Delete own listings
- Update listing status (`available` | `sold` | `removed`)
- Send messages (planned)
- Receive messages (planned)
- Report products (planned)
- Manage profile

Cannot:

- Delete other users' products
- Access admin functionality

## Admin

Can:

- View all users
- Create / update / delete categories
- (Reports & moderation — planned)

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

**Categories:**

- Public list of categories
- Products by category

**Profile / listings:**

- User's own products (`GET /api/v1/my-products`)

**Planned (not yet in API):**

- Buyer-to-seller messaging
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
- Real-time notifications
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

## users

- `id` (UUID), `username`, `email`, `password_hash`, `role`, `is_verified`, timestamps

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

## Protected (Bearer JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/profile` | Current user |
| GET | `/api/v1/my-products` | Seller's listings |
| POST | `/api/v1/products` | Create product (multipart) |
| PUT | `/api/v1/products/:id` | Update product (multipart) |
| PATCH | `/api/v1/products/:id/status` | Update status JSON `{ "status": "..." }` |
| DELETE | `/api/v1/products/:id` | Delete product |

## Admin (JWT + admin role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/users` | All users |
| POST | `/api/v1/admin/categories` | Create category |
| PUT | `/api/v1/admin/categories/:id` | Update category |
| DELETE | `/api/v1/admin/categories/:id` | Delete category |

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
├── components/       # Navbar, Footer, Button, Input, Card, etc.
├── sell/             # 3-step listing wizard
│   ├── page.tsx           # Step 1: Upload photos
│   ├── details/page.tsx   # Step 2: Item details
│   └── pricing/page.tsx   # Step 3: Pricing & location
├── details/[id]/     # Product detail page
├── context/          # ListingFormContext (wizard state)
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

Shows image, title, condition badge, price, location/time (mock or extended API later), description, category, seller card, safe-transaction info, chat CTA, and reserve/deposit CTA (visual only until payments are in scope).

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
