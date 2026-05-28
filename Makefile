.PHONY: help install dev build docker-up docker-down docker-build clean

help:
	@echo "Campus Marketplace - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Start both frontend and backend in development mode"
	@echo "  make dev-backend      - Start backend development server"
	@echo "  make dev-frontend     - Start frontend development server"
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
	@echo "  make docker-up        - Start all services with Docker Compose"
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
	@echo "Stopping development servers..."
	pkill -f "go run cmd/api/main.go"
	pkill -f "npm run dev"
	@echo "Development servers stopped!"

# Build targets
build: build-backend build-frontend
	@echo "Build complete!"

build-backend:
	@echo "Building backend..."
	cd backend && go build -o bin/api ./cmd/api/main.go

build-frontend:
	@echo "Building frontend..."
	cd frontend && npm run build

# Docker targets
docker-up:
	@echo "Starting Docker Compose services..."
	docker-compose up

docker-down:
	@echo "Stopping Docker Compose services..."
	docker-compose down

docker-build:
	@echo "Building Docker images..."
	docker-compose build

docker-logs:
	@echo "Showing Docker Compose logs..."
	docker-compose logs -f

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
