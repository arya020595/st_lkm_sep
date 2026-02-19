# =============================================================================
# LKM-SEP v2 — Makefile
# =============================================================================
# Quick commands for development and production Docker workflows.
# =============================================================================

.PHONY: help dev dev-build dev-down dev-logs dev-restart \
        prod prod-build prod-down prod-logs prod-restart \
        build-graphql build-app clean status

# --- Default ---
help: ## Show this help
	@echo ""
	@echo "  LKM-SEP v2 — Docker Commands"
	@echo "  ============================="
	@echo ""
	@echo "  Development:"
	@echo "    make dev            Start development environment"
	@echo "    make dev-build      Build & start development environment"
	@echo "    make dev-down       Stop development environment"
	@echo "    make dev-logs       Tail development logs"
	@echo "    make dev-restart    Restart development environment"
	@echo ""
	@echo "  Production:"
	@echo "    make prod           Start production environment"
	@echo "    make prod-build     Build & start production environment"
	@echo "    make prod-down      Stop production environment"
	@echo "    make prod-logs      Tail production logs"
	@echo "    make prod-restart   Restart production environment"
	@echo ""
	@echo "  Utilities:"
	@echo "    make build-graphql  Build only the GraphQL image"
	@echo "    make build-app      Build only the App image"
	@echo "    make status         Show running containers"
	@echo "    make clean          Remove all containers, volumes, and images"
	@echo ""

# =============================================================================
# Development
# =============================================================================

dev: ## Start development environment (without rebuild)
	docker compose -f docker-compose.dev.yml up

dev-build: ## Build and start development environment
	docker compose -f docker-compose.dev.yml up --build

dev-down: ## Stop development environment
	docker compose -f docker-compose.dev.yml down

dev-logs: ## Tail development logs
	docker compose -f docker-compose.dev.yml logs -f

dev-restart: ## Restart development environment
	docker compose -f docker-compose.dev.yml restart

# =============================================================================
# Production
# =============================================================================

prod: ## Start production environment (without rebuild)
	docker compose up -d

prod-build: ## Build and start production environment
	docker compose up -d --build

prod-down: ## Stop production environment
	docker compose down

prod-logs: ## Tail production logs
	docker compose logs -f

prod-restart: ## Restart production environment
	docker compose restart

# =============================================================================
# Individual Builds
# =============================================================================

build-graphql: ## Build only the GraphQL Docker image
	docker compose build graphql

build-app: ## Build only the App Docker image
	docker compose build app

# =============================================================================
# Utilities
# =============================================================================

status: ## Show running containers
	docker compose ps 2>/dev/null; docker compose -f docker-compose.dev.yml ps 2>/dev/null

clean: ## Remove all containers, volumes, and images for this project
	docker compose -f docker-compose.dev.yml down -v --rmi local 2>/dev/null || true
	docker compose down -v --rmi local 2>/dev/null || true
	@echo "Cleaned up all LKM-SEP containers, volumes, and local images."
