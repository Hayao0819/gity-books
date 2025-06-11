.PHONY: dev dev-api dev-web build up down logs clean install

# Development commands
dev: dev-api dev-web

dev-api:
	cd api && go run main.go

dev-web:
	cd web && npm run dev

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
	cd api && go mod tidy

install-web:
	cd web && npm install

# Database commands
db-migrate:
	cd api && go run main.go migrate

db-seed:
	cd api && go run main.go seed

# Production commands
prod-build:
	docker-compose -f docker-compose.yml build

prod-up:
	docker-compose -f docker-compose.yml up -d

prod-down:
	docker-compose -f docker-compose.yml down
