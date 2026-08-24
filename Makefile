.PHONY: help dev stop logs migrate seed

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start all services in development mode
	docker compose -f docker-compose.yml up --build

stop: ## Stop all services
	docker compose down

logs: ## Tail logs from all services
	docker compose logs -f

migrate: ## Run database migrations
	docker compose exec backend alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MSG="add users table")
	docker compose exec backend alembic revision --autogenerate -m "$(MSG)"

seed: ## Seed the database with sample data
	docker compose exec backend python -m app.seed

backend-shell: ## Open a Python shell in the backend
	docker compose exec backend python

db-shell: ## Open a psql shell
	docker compose exec db psql -U voice_agents -d voice_agents

redis-cli: ## Open a redis-cli shell
	docker compose exec redis redis-cli
