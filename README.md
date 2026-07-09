# Campus Marketplace

A peer-to-peer marketplace for university students. Every student can list items and browse or message about others' listings. Features escrow payments via CamPay mobile money, pay-to-chat gating, and a full admin dashboard.

**Not in scope:** ratings, reviews, delivery system, mobile app, AI recommendations.

## Tech Stack

- **Frontend:** Next.js 16, React 18, TypeScript, Tailwind CSS, lucide-react
- **Backend:** Go 1.25+, Gin web framework, sqlc, golang-migrate, JWT auth, bcrypt, gofpdf
- **Database:** PostgreSQL (UUID primary keys)
- **Infrastructure:** Docker, Vercel (frontend), Railway (backend), Cloudinary (images), CamPay (payments)

## Project Structure

```
Campus-Marketplace/
├── frontend/
│   ├── app/
│   │   ├── components/     # Reusable components (Navbar, Footer, Button, Card, etc.)
│   │   ├── admin/          # Admin dashboard (users, categories, payments, reports)
│   │   ├── context/        # React context providers (Notification, ListingForm)
│   │   ├── details/[id]/   # Product detail page (pay-to-chat flow)
│   │   ├── sell/           # 3-step listing wizard
│   │   ├── conversations/  # Messaging (two-panel layout)
│   │   ├── purchases/      # Purchase history with confirm/reject
│   │   ├── sales/          # Sales history with fee breakdown
│   │   ├── profile/        # Profile dashboard with stat cards
│   │   ├── mylistings/     # Current user's listings (edit/sold/delete actions)
│   │   ├── my-reports/     # Submitted reports
│   │   ├── category/[id]/  # Products filtered by category
│   │   ├── edit/[id]/      # Edit product page
│   │   ├── register/       # Registration with phone number
│   │   ├── login/          # Email/password login
│   │   ├── report/         # Report a listing
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # API helpers (api.ts, paymentApi.ts, authApi.ts, adminApi.ts)
│   ├── customHooks/        # Shared React hooks (useGetProducts, useCreateProduct, useRegister)
│   └── package.json
├── backend/
│   ├── cmd/api/main.go     # Entry point
│   ├── internal/
│   │   ├── config/         # Configuration (fees, CamPay creds)
│   │   ├── db/
│   │   │   ├── migrations/ # SQL migrations (014 report details, 011 payments)
│   │   │   ├── queries/    # sqlc query definitions
│   │   │   └── sqlc/       # Generated Go code
│   │   ├── handlers/       # HTTP handlers (auth, product, payment, message, etc.)
│   │   ├── middleware/     # JWT auth, CORS
│   │   ├── models/         # DTOs & response mappers
│   │   ├── notification/   # Notification service + types
│   │   ├── repository/     # Data access layer
│   │   ├── services/       # Business logic (Auth, Product, Cloudinary, CamPay, Receipt)
│   │   └── ws/             # WebSocket hub + client
│   ├── pkg/utils/
│   └── sqlc.yaml
├── docker-compose.yml       # Default stack (production images)
├── docker-compose.dev.yml   # Dev override (hot reload, source-mounted)
├── .env.example             # Root env template for Compose
└── README.md
```

## Getting Started

### Prerequisites
- **Docker only** (recommended): Docker Desktop (Windows/macOS) or Docker Engine + Compose v2 (Linux). Nothing else required.
- **Manual setup**: Node.js 18+, Go 1.25+, PostgreSQL 15+

### Quick start (Docker)

Works identically on Linux and Windows (Docker Desktop / WSL2). From the repo root:

```bash
# Optional: copy the env template and edit it (the stack also runs with no .env)
cp .env.example .env

# Build images and start everything (Postgres + backend + frontend)
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080 (health check at `/health`)
- Postgres: localhost:5432

Database migrations run automatically on backend startup, and the default admin
is seeded on first boot (`admin@campusmarket.local` / `password` unless overridden).

Stop and remove containers with `docker compose down` (add `-v` to also wipe the
database and uploaded-files volumes).

#### Hot-reload development

Mounts your source into the containers so edits are picked up live (file-watch
polling is enabled so this works on Windows/WSL2 too):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Frontend changes reload automatically. After editing Go code, restart the backend
container (`docker compose restart backend`) to rebuild.

> Make shortcuts: `make docker-up`, `make docker-dev`, `make docker-down`, `make docker-logs`.

#### Configuration

All settings have safe dev defaults, so `docker compose up` works out of the box.
Override them via a root `.env` file (see `.env.example`). Note `NEXT_PUBLIC_API_URL`
/ `NEXT_PUBLIC_WS_URL` are **baked into the frontend at build time** and must be
reachable from the browser — keep them as `localhost:8080` for local use, or set
your public host and rebuild (`docker compose up --build`) when deploying remotely.

> **Windows note:** the repo ships a `.gitattributes` that forces LF line endings,
> so Docker builds work on Windows checkouts. If you cloned before it was added and
> hit "exec format" errors, run `git rm --cached -r . && git reset --hard` to
> re-normalize, or ensure your editor saves these files with LF.

### Manual setup
```bash
# Backend
cd backend && cp .env.example .env && go mod download && go run cmd/api/main.go

# Frontend
cd frontend && cp .env.example .env.local && npm install && npm run dev
```

## Platform Model

- **Peer-to-peer:** All authenticated students can browse, list, and message. No buyer/seller roles.
- **Two account types:** Students (`users` table) and admins (`admins` table), separate login endpoints, JWT `actor_type` claim.
- **Account statuses:** `pending` → `approved` | `rejected` | `blocked`. Pending/rejected/blocked cannot log in.

### Admin bootstrap

The platform needs a first admin before any admin can log in, which is a chicken-and-egg problem (admin endpoints require an admin token). There are two ways to create that first admin, both of which only work while the `admins` table is **empty**:

1. **Seed on startup (default).** Set `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`. On boot, `EnsureDefaultAdmin` creates the admin if none exists. Best for self-hosted deployments where you control the environment.

2. **One-time HTTP bootstrap.** Set `ADMIN_BOOTSTRAP_TOKEN` to a long random secret and call:

   ```bash
   curl -X POST https://<host>/api/v1/admin/create \
     -H "X-Admin-Bootstrap-Token: <ADMIN_BOOTSTRAP_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"username":"root","email":"admin@example.com","password":"<strong-password>"}'
   ```

   This endpoint is public by necessity (no admin token can exist yet) but is guarded two ways: the request must carry the matching `X-Admin-Bootstrap-Token` header (constant-time compared), **and** it only succeeds while no admin exists. Once any admin is created — by either method — the endpoint returns `403` permanently. If `ADMIN_BOOTSTRAP_TOKEN` is unset, the endpoint is disabled (`403`) and only the seed path is available.

   After bootstrapping, additional admins are created from within the app by an authenticated admin; rotate or unset `ADMIN_BOOTSTRAP_TOKEN` afterwards.

## Payment Flow (Escrow via CamPay)

1. Product detail → "Pay to Chat" button → enter phone number → CamPay USSD prompt
2. Confirm on phone → payment held in escrow → chat unlocked
3. Buyer reviews item → confirms delivery → payment released to seller (minus 3% fee)
4. Buyer cancels → refund to buyer (minus 1% fee)
5. PDF receipt generated and stored on Cloudinary

**Chat gating:** Message sending (WebSocket) and listing/message history (REST) both check for active payment. Set `DEV_BYPASS_PAYMENT=true` on the backend to bypass for testing — this is ignored when `ENV=production`, so it can never disable real payments in a live deployment.

## Key Design Decisions

- **No GORM, no MongoDB** — raw SQL via sqlc, PostgreSQL only
- **Images stored on Cloudinary** — four columns (`image_url_1`..`image_url_4`)
- **Payments via CamPay mobile money** — MTN & Orange, USSD prompt flow
- **3% platform fee on sale** (configurable in `config.go`)
- **1% platform fee on refund** (configurable in `config.go`)
- **Notifications** — in-app via WebSocket + email via queue (DB table)

## API Endpoints

See the route definitions in `backend/internal/handlers/routes.go` for the complete list. Key groups:
- **Public:** health, register, login, categories, products (list/search/detail), webhook
- **Protected (student JWT):** profile, my-products, CRUD products, reports (`product_id` + `reason` ∈ `fake_listing|wrong_price|scam|inappropriate|other` + optional `details` ≤250 chars), conversations, messages, payments (initiate/status/confirm/reject/receipt), purchases, sales
- **Admin (admin JWT):** users, pending-users, approve/reject/block, categories CRUD, reports (reporter, product, reason, details, status), held payments

## Environment Variables

### Backend (`backend/.env.example`)
- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` (the DSN is built from these)
- `JWT_SECRET` (**required** — the server refuses to start without it)
- `ALLOWED_ORIGINS` (comma-separated CORS/WebSocket origin allow-list)
- `ADMIN_*` (default admin seed — see [Admin bootstrap](#admin-bootstrap)), `ADMIN_BOOTSTRAP_TOKEN` (one-time HTTP admin bootstrap secret)
- `DEV_BYPASS_PAYMENT` (testing only; simulates payments — ignored when `ENV=production`)
- `CLOUDINARY_*` (optional — falls back to local `./uploads` if unset), `CAMPAY_*`

### Frontend (`frontend/.env.example`)
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`

## UI-only (not yet in API)
- Meetup `location` field (collected in listing wizard, not persisted)

## Admin Dashboard

Routes: `/admin/login` → `/admin/users`, `/admin/categories`, `/admin/payments`, `/admin/reports`

## License

MIT
