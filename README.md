# Campus Marketplace

A full-stack marketplace platform designed for campus students to buy and sell items.

## Project Overview

Campus Marketplace is a modern web application that enables students to buy and sell items within their campus community. The application features a responsive frontend built with Next.js and a robust backend API built with Go.

## Tech Stack

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Fetch API

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin Web Framework
- **Database**: PostgreSQL
- **API**: RESTful API

## Project Structure

```
Campus-Marketplace/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # Next.js app directory
│   ├── public/              # Static assets
│   ├── package.json         # Dependencies
│   └── tsconfig.json        # TypeScript config
├── backend/                 # Go backend API
│   ├── cmd/api/            # Application entry point
│   ├── internal/           # Private application code
│   ├── pkg/                # Public packages
│   ├── go.mod              # Go module definition
│   └── migrations/         # Database migrations
├── docker-compose.yml      # Docker Compose configuration
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ (for frontend)
- Go 1.21+ (for backend)
- Docker & Docker Compose (optional, for containerized development)
- PostgreSQL 15+ (or use Docker)

### Setup with Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd Campus-Marketplace
```

2. Start all services:
```bash
docker-compose up
```

3. Access the applications:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432

### Manual Setup

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Install dependencies:
```bash
go mod download
```

4. Run the server:
```bash
go run cmd/api/main.go
```

The backend will be available at `http://localhost:8080`

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Install dependencies:
```bash
npm install
```

4. Run development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```

### Status
```
GET /api/v1/status
```

Detailed API documentation will be available at `/api/docs` (coming soon).

## Development

### Frontend Development
- Edit files in `frontend/app/`
- Changes will hot-reload at http://localhost:3000
- Run linting: `npm run lint`
- Format code: `npm run format`

### Backend Development
- Edit files in `backend/internal/`
- Run with: `go run cmd/api/main.go`
- Run tests: `go test ./...`

### Database Migrations
Database migrations are stored in `backend/migrations/`

## Deployment

### Docker Build

Build backend:
```bash
docker build -t campus-marketplace-backend ./backend
```

Build frontend:
```bash
docker build -t campus-marketplace-frontend ./frontend
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push and create a pull request

## Troubleshooting

### Port conflicts
If ports 3000, 8080, or 5432 are already in use:
- Change ports in `docker-compose.yml` or `.env` files
- Or stop services using those ports

### Database connection errors
- Ensure PostgreSQL is running
- Check `.env` file has correct database credentials
- Run database migrations

### Module not found errors
- Frontend: Run `npm install`
- Backend: Run `go mod download`

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please create an issue on GitHub.
