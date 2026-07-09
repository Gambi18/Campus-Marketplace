# syntax=docker/dockerfile:1

# ---- Build stage -----------------------------------------------------------
# Pinned to the Go version in go.mod (1.25). Alpine keeps the toolchain small.
FROM golang:1.25-alpine AS builder

WORKDIR /app

# git is needed by `go mod download` for some modules.
RUN apk add --no-cache git

# Copy module files first so dependency downloads are cached across source edits.
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source and build a static binary (no libc dependency),
# so it runs in a minimal final image regardless of host OS.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/api ./cmd/api/main.go

# ---- Run stage -------------------------------------------------------------
FROM alpine:3.20

# ca-certificates: outbound HTTPS (Cloudinary, CamPay). wget: container healthcheck.
RUN apk add --no-cache ca-certificates wget \
    && adduser -D -u 1001 appuser

WORKDIR /app

# The binary resolves migrations at runtime via a path relative to its working
# directory (file://internal/db/migrations), so that tree must ship in the image.
COPY --from=builder /app/bin/api ./api
COPY --from=builder /app/internal/db/migrations ./internal/db/migrations
COPY --from=builder /app/.env.example ./.env.example

# ./uploads is the local-disk fallback when Cloudinary is not configured.
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

# Marks the container healthy once the HTTP server answers, which compose uses
# to gate the frontend's startup.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
    CMD wget -qO- http://127.0.0.1:8080/health >/dev/null 2>&1 || exit 1

CMD ["./api"]
