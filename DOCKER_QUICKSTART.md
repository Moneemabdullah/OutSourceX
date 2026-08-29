# 🐳 Docker Quick Start Guide

## For First-Time Setup

### Step 1: Prerequisites
Ensure Docker and Docker Compose are installed:
```bash
docker --version  # Should be 20.10+
docker-compose --version  # Should be 2.0+
```

### Step 2: Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Open .env and update these values for your setup:
# - POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB for the local database
# - DATABASE_URL only when running the app outside Docker
# - API keys (Google OAuth, Stripe, Cloudinary, etc.)
# - SMTP credentials for email
```

### Step 3: Start Development
```bash
# Start all services (database + backend)
make dev-up

# Initialize database (first time only)
make db-push

# Seed super admin (first time only)
make db-seed
```

### Step 4: Verify It's Working
- API: http://localhost:3000
- Health check: http://localhost:3000/health (should return `{"status":"ok"}`)
- Database UI (Adminer): http://localhost:8080

## Common Tasks

| Task | Command |
|------|---------|
| Start development | `make dev-up` |
| Stop development | `make dev-down` |
| View logs | `make dev-logs` |
| Access backend shell | `make dev-shell` |
| Forward Stripe webhooks | `make dev-stripe-webhook` |
| Run database migrations | `make db-migrate` |
| Open Prisma Studio | `make db-studio` |
| Fix linting issues | `make lint-fix` |
| Format code | `make format` |

## Stripe webhook testing

With the backend running, use separate terminals:

```bash
make dev-logs
make dev-stripe-webhook
stripe trigger payment_intent.succeeded
```

The Stripe CLI forwards events from the host to `http://localhost:3000/webhook`.

Prisma Studio runs in the backend container at [http://localhost:51212](http://localhost:51212).
It does not open a browser in the container.

## Changing local PostgreSQL credentials or database name

PostgreSQL reads `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` only
when its data volume is first initialized. If you change any of those values in
`.env`, reset **only disposable development data** before starting again:

```bash
docker compose down -v
make dev-up
make db-push
```

This deletes the local development database; never use it for production.

## Troubleshooting

### Ports already in use
If port 3000 or 5432 is already in use:
```bash
# Edit .env and change:
APP_PORT=3001
DB_PORT=5433
```

### Database won't connect
```bash
# Check if database is running
make ps

# Check logs
make dev-logs

# Restart everything
make clean
make dev-up
```

### Out of disk space
```bash
# Clean up Docker images, volumes, and containers
make clean
```

## File Structure

- `Dockerfile` - Multi-stage build for production
- `docker-compose.yml` - Development setup
- `docker-compose.prod.yml` - Production setup
- `.dockerignore` - Excludes files from Docker builds
- `Makefile` - Convenient command shortcuts
- `DOCKER.md` - Comprehensive Docker documentation
- `.env.example` - Environment variable template

## Notes

- Hot-reload is enabled in development (changes update automatically)
- Adminer is available for database management (optional)
- Data persists in Docker volumes even after container restart
- All services log to stdout (use `make dev-logs` to view)

For more details, see [DOCKER.md](DOCKER.md)
