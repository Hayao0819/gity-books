.PHONY: dev dev-api dev-web build up down logs clean install

# Development commands
dev:
	@echo "Starting development servers..."
	@make -j2 dev-api dev-web

dev-api:
	@echo "Starting Go API server..."
	cd api && go run main.go

dev-web:
	@echo "Starting Next.js web server..."
	npm run dev

# Docker commands
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

# Installation commands
install: install-api install-web

install-api:
	@echo "Installing Go dependencies..."
	cd api && go mod tidy

install-web:
	@echo "Installing Node.js dependencies..."
	npm install

# Database commands (for local development)
db-setup:
	@echo "Please run the SQL commands in Supabase dashboard to create tables"
	@echo "See README.md for the SQL schema"

# Production commands
prod-build:
	docker-compose -f docker-compose.yml build

prod-up:
	docker-compose -f docker-compose.yml up -d

prod-down:
	docker-compose -f docker-compose.yml down

# Help
help:
	@echo "Available commands:"
	@echo "  dev          - Start both API and web servers"
	@echo "  dev-api      - Start only the Go API server"
	@echo "  dev-web      - Start only the Next.js web server"
	@echo "  build        - Build Docker images"
	@echo "  up           - Start services with Docker Compose"
	@echo "  down         - Stop Docker Compose services"
	@echo "  logs         - Show Docker Compose logs"
	@echo "  clean        - Clean up Docker resources"
	@echo "  install      - Install all dependencies"
	@echo "  install-api  - Install Go dependencies"
	@echo "  install-web  - Install Node.js dependencies"
	@echo "  help         - Show this help message"
