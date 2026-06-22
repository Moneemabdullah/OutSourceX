# Use 'docker compose' instead of 'docker-compose' for compatibility
DC = docker compose

.PHONY: help dev-up dev-down dev-logs db-migrate db-push db-studio db-backup db-restore lint lint-fix format build prod-up prod-down prod-logs clean

help:
	@echo "OutsourceX Docker Commands"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev-up          - Start development environment"
	@echo "  make dev-down        - Stop development environment"
	@echo "  make dev-logs        - View development logs"
	@echo "  make dev-shell       - Access backend container shell"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-migrate      - Run Prisma migrations"
	@echo "  make db-push         - Push schema to database"
	@echo "  make db-studio       - Open Prisma Studio"
	@echo "  make db-backup       - Backup database"
	@echo "  make db-restore      - Restore database from backup"
	@echo "  make db-shell        - Access PostgreSQL shell"
	@echo ""
	@echo "Code Commands:"
	@echo "  make lint            - Run ESLint"
	@echo "  make lint-fix        - Fix ESLint issues"
	@echo "  make format          - Format code with Prettier"
	@echo "  make build           - Build Docker image"
	@echo ""
	@echo "Production Commands:"
	@echo "  make prod-up         - Start production environment"
	@echo "  make prod-down       - Stop production environment"
	@echo "  make prod-logs       - View production logs"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean           - Clean up all containers and volumes"

# Development
dev-up:
	$(DC) up -d

dev-down:
	$(DC) down

dev-logs:
	$(DC) logs -f backend

dev-shell:
	$(DC) exec backend sh

# Database
db-migrate:
	$(DC) exec backend npm run db:migrate

db-push:
	$(DC) exec backend npm run db:push

db-studio:
	$(DC) exec backend npm run db:studio

db-backup:
	@$(DC) exec postgres pg_dump -U outsourcex_user -d outsourcex_dev > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Database backed up to backup_$(shell date +%Y%m%d_%H%M%S).sql"

db-restore:
	@read -p "Enter backup file name: " FILE; \
	$(DC) exec -T postgres psql -U outsourcex_user -d outsourcex_dev < $$FILE; \
	echo "Database restored from $$FILE"

db-shell:
	$(DC) exec postgres psql -U outsourcex_user -d outsourcex_dev

# Code
lint:
	$(DC) exec backend npm run lint

lint-fix:
	$(DC) exec backend npm run lint:fix

format:
	$(DC) exec backend npm run format

build:
	$(DC) build --no-cache

# Production
prod-up:
	$(DC) -f docker-compose.prod.yml up -d

prod-down:
	$(DC) -f docker-compose.prod.yml down

prod-logs:
	$(DC) -f docker-compose.prod.yml logs -f backend

# Cleanup
clean:
	$(DC) down -v
	docker image rm outsourcex-backend-dev outsourcex-backend-prod 2>/dev/null || true
	docker volume prune -f
	@echo "Cleanup complete"

# Initialize
init: dev-up db-push db-seed

db-seed:
	$(DC) exec backend npm run admin:seed

# Utility
ps:
	$(DC) ps

status:
	$(DC) ps

restart:
	$(DC) restart backend

rebuild:
	$(DC) build --no-cache && $(DC) up -d
