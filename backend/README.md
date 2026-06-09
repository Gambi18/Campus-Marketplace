# Campus Marketplace Backend

A RESTful API backend for the Campus Marketplace platform built with Go and Gin.

## Tech Stack

- **Language**: Go 1.21+
- **Framework**: Gin Web Framework
- **Database**: PostgreSQL (or MongoDB)
- **Port**: 8080 (default)

## Project Structure

```
backend/
├── cmd/
│   └── api/                 # Application entry point
│       └── main.go
├── internal/                # Private application code
│   ├── config/             # Configuration management
│   ├── db/                 # Database migrations and sqlc
│   ├── handlers/           # HTTP request handlers
│   ├── middleware/         # Middleware functions
│   ├── models/             # Data models
│   ├── notification/       # Notification service
│   ├── repository/         # Data access layer
│   └── services/           # Business logic
├── pkg/
│   └── utils/              # Public utility packages
├── migrations/             # Database migration files
├── tests/                  # Test files
├── main.go                 # Main entry point
├── go.mod                  # Go module definition
├── go.sum                  # Go module checksums
├── .env.example            # Environment variables example
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Go 1.21 or higher
- PostgreSQL or MongoDB (optional for development)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
```bash
cd backend
```

3. Install dependencies:
```bash
go mod download
```

### Environment Variables

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Update the `.env` file with your configuration.

### Running the Server

Development mode:
```bash
go run main.go
```

Or from the cmd directory:
```bash
go run ./cmd/api
```

The API will be available at `http://localhost:8080`

### API Endpoints

#### Health Check
```
GET /health
```
Response: `{"status": "ok"}`

#### API Status
```
GET /api/v1/status
```
Response: `{"message": "Campus Marketplace API v1"}`

### Building

Build the executable:
```bash
go build -o bin/api ./cmd/api
```

### Testing

Run tests:
```bash
go test ./...
```

Run tests with coverage:
```bash
go test -cover ./...
```

### Development

#### Project Organization

- **cmd/api/**: Application entry point and main function
- **internal/handlers/**: HTTP request handlers and route definitions
- **internal/services/**: Business logic and service layer
- **internal/models/**: Data structures and models
- **internal/repository/**: Database access and queries
- **internal/config/**: Configuration management
- **internal/middleware/**: Custom middleware
- **pkg/utils/**: Reusable utility functions
- **migrations/**: Database schema migrations

#### Adding New Features

1. Define models in `internal/models/`
2. Create repository in `internal/repository/`
3. Implement service logic in `internal/services/`
4. Add handlers in `internal/handlers/`
5. Register routes in `cmd/api/main.go`

## API Documentation

API documentation will be generated with Swagger/OpenAPI (coming soon).

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and ensure they pass
4. Commit and push
5. Open a pull request

## License

MIT License - see LICENSE file for details
