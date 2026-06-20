.PHONY: help install dev dev-stop stop build docker-up docker-dev docker-dev-down docker-down docker-build docker-logs clean

# Ports the local (non-Docker) dev servers listen on. Override if you changed
# them, e.g. `make dev-stop DEV_BACKEND_PORT=9090`.
DEV_BACKEND_PORT  ?= 8080
DEV_FRONTEND_PORT ?= 3000

help:
	@echo "Campus Marketplace - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Start both frontend and backend in development mode"
	@echo "  make dev-backend      - Start backend development server"
	@echo "  make dev-frontend     - Start frontend development server"
	@echo "  make dev-stop         - Stop local (non-Docker) dev servers"
	@echo "  make stop             - Stop EVERYTHING (local dev servers + Docker stacks)"
	@echo ""
	@echo "Installation:"
	@echo "  make install          - Install dependencies for both frontend and backend"
	@echo "  make install-backend  - Install backend dependencies"
	@echo "  make install-frontend - Install frontend dependencies"
	@echo ""
	@echo "Building:"
	@echo "  make build            - Build both frontend and backend"
	@echo "  make build-backend    - Build backend"
	@echo "  make build-frontend   - Build frontend"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up        - Build & start all services (production images)"
	@echo "  make docker-dev       - Start all services with hot reload"
	@echo "  make docker-dev-down  - Stop the hot-reload (dev) services"
	@echo "  make docker-down      - Stop all Docker Compose services"
	@echo "  make docker-build     - Build Docker images"
	@echo "  make docker-logs      - View Docker Compose logs"
	@echo ""
	@echo "Testing:"
	@echo "  make test             - Run all tests"
	@echo "  make test-backend     - Run backend tests"
	@echo "  make test-frontend    - Run frontend tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint             - Lint both frontend and backend"
	@echo "  make lint-backend     - Lint backend"
	@echo "  make lint-frontend    - Lint frontend"
	@echo "  make format           - Format code in frontend"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Remove dependencies and build artifacts"
	@echo ""

# Installation targets
install: install-backend install-frontend
	@echo "Dependencies installed!"

install-backend:
	@echo "Installing backend dependencies..."
	cd backend && go mod download

install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Development targets
dev: dev-backend dev-frontend
	@echo "Development servers started!"

dev-backend:
	@echo "Starting backend development server..."
	cd backend && go run cmd/api/main.go & 

dev-frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev & 

dev-stop:
	@echo "Stopping local (non-Docker) development servers..."
	@# Kill by listening port — the real servers are child processes (go run's
	@# compiled temp binary, next-server/Turbopack workers) that name-based pkill
	@# misses, so they keep holding the ports. SIGTERM first, then SIGKILL.
	@for port in $(DEV_BACKEND_PORT) $(DEV_FRONTEND_PORT); do \
		pids=$$(lsof -ti tcp:$$port 2>/dev/null); \
		if [ -n "$$pids" ]; then \
			echo "  port $$port -> killing PID(s): $$pids"; \
			kill $$pids 2>/dev/null || true; \
			sleep 1; \
			pids=$$(lsof -ti tcp:$$port 2>/dev/null); \
			[ -n "$$pids" ] && kill -9 $$pids 2>/dev/null || true; \
		fi; \
	done
	@# Fallback: sweep any stray parents not bound to those ports. The bracketed
	@# first char keeps the pattern from matching pkill's own shell command line.
	-@pkill -f "[c]md/api/main.go" 2>/dev/null || true
	-@pkill -f "go-build.*[e]xe/main" 2>/dev/null || true
	-@pkill -f "[n]ext dev" 2>/dev/null || true
	-@pkill -f "[n]ext-server" 2>/dev/null || true
	@echo "Local development servers stopped!"

# Stop EVERYTHING: local host dev servers + both Docker stacks (prod and dev).
stop: dev-stop docker-dev-down
	@echo "All environments stopped!"

# Build targets
build: build-backend build-frontend
	@echo "Build complete!"

build-backend:
	@echo "Building backend..."
	cd backend && go build -o bin/api ./cmd/api/main.go

build-frontend:
	@echo "Building frontend..."
	cd frontend && npm run build

# Docker targets (Compose v2 syntax: `docker compose`, not `docker-compose`)
docker-up:
	@echo "Building & starting Docker Compose services..."
	docker compose up --build

docker-dev:
	@echo "Starting Docker Compose services with hot reload..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

docker-dev-down:
	@echo "Stopping hot-reload Docker Compose services..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

docker-down:
	@echo "Stopping Docker Compose services..."
	docker compose down

docker-build:
	@echo "Building Docker images..."
	docker compose build

docker-logs:
	@echo "Showing Docker Compose logs..."
	docker compose logs -f

# Testing targets
test: test-backend test-frontend
	@echo "All tests completed!"

test-backend:
	@echo "Running backend tests..."
	cd backend && go test -v ./...

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm test

# Code quality targets
lint: lint-backend lint-frontend

lint-backend:
	@echo "Linting backend..."
	cd backend && go vet ./...

lint-frontend:
	@echo "Linting frontend..."
	cd frontend && npm run lint

format:
	@echo "Formatting frontend code..."
	cd frontend && npm run format

# Cleanup
clean:
	@echo "Cleaning up..."
	cd backend && rm -rf bin/ vendor/
	cd frontend && rm -rf node_modules .next
	@echo "Cleanup complete!"
