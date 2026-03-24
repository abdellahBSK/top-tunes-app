.PHONY: dev build up down logs clean install

## ── Dev (Vite frontend + Docker backend) ─────────────────────
dev:
	@echo "Starting backend + DB..."
	docker-compose up -d --build
	@echo "Starting Vite dev server..."
	cd frontend && npm install && npm run dev

## ── Production build ─────────────────────────────────────────
build:
	@echo "Building frontend..."
	cd frontend && npm install && npm run build
	@echo "Starting production stack..."
	NODE_ENV=production docker-compose up --build

## ── Docker shortcuts ─────────────────────────────────────────
up:
	docker-compose up --build

down:
	docker-compose down

logs:
	docker-compose logs -f backend

## ── Install all deps ─────────────────────────────────────────
install:
	cd backend && npm install
	cd frontend && npm install

## ── Full cleanup ─────────────────────────────────────────────
clean:
	docker-compose down -v
	rm -rf frontend/dist frontend/node_modules backend/node_modules
