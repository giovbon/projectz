# Stage 1: Build Frontend (Preact + Vite)
FROM node:20-alpine AS web
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm ci --frozen-lockfile 2>/dev/null || npm install
COPY web/ .
RUN npm run build

# Stage 2: Build Go Backend
FROM golang:1.22-alpine AS go
WORKDIR /app
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/ .
# Copy built frontend into embed directory
COPY --from=web /app/server/embed ./embed/
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

# Stage 3: Runtime
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=go /app/server /app/server

# Content is mounted as a volume
VOLUME ["/app/content"]

# Environment defaults
ENV CONTENT_PATH=/app/content
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["/app/server"]
