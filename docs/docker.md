# 🐳 Docker Guide - OutsourceX Backend

This guide explains how to use Docker to run the OutsourceX backend application.

## 📋 Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- Git

## 🚀 Quick Start

### Development Environment

1. **Clone the repository and navigate to the project:**

   ```bash
   cd /path/to/OutsourceX
   ```

2. **Create a `.env` file from the example:**

   ```bash
   cp .env.example .env
   ```

3. **Update environment variables in `.env`** if needed (customize for your setup)

4. **Start the development environment:**

   ```bash
   make dev-up
   ```

5. **Initialize the database (first time only):**

   ```bash
   make db-push
   ```

6. **Seed the super admin account (first time only):**

   ```bash
   make db-seed
   ```

7. **Access the application:**

   - API: http://localhost:3000
   - Adminer (database UI): http://localhost:8080
   - Health check: http://localhost:3000/health
   - Prisma Studio: http://localhost:51212

### Production Environment

1. **Create a production `.env` file:**

   ```bash
   cp .env.example .env.prod
   # Update with production values
   ```

2. **Build and start production containers:**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Run database migrations:**

   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run db:push
   ```

## 📦 Docker Files Explanation

### `Dockerfile`

- Multi-stage build for optimized image size
- Uses Node.js 22-alpine for small image size
- Includes entrypoint script for automated setup
- Health check configured
- Runs with dumb-init for proper signal handling

### `docker-compose.yml` (Development)

- PostgreSQL 16: Database service with hot-reload volumes
- Backend: Application with hot-reload (using `npm run dev`)
- Adminer: Web UI for database management (optional)
- Volumes: Source code and node_modules mounted
- Network: Internal communication between services

### `docker-compose.prod.yml` (Production)

- PostgreSQL 16: Database with optimized settings
- Backend: Production image (no hot-reload)
- Logging: JSON file logging with rotation
- Restart Policies: Always restart on failure
- Backups Volume: For database backups

### `.dockerignore`

Excludes unnecessary files from the Docker build context to reduce build time and image size.

## 🛠️ Common Commands

### Development Commands

```bash
# Start all services
make dev-up

# Stop development
make dev-down

# View logs
make dev-logs

# Access backend shell
make dev-shell

# Forward Stripe webhooks
make dev-stripe-webhook

# Run database migrations
make db-migrate

# Open Prisma Studio
make db-studio

# Seed super admin
make db-seed

# Fix linting issues
make lint-fix

# Format code
make format
```

### Production Commands

```bash
# Start production stack
make prod-up

# Stop production stack
make prod-down

# View production logs
make prod-logs

# Access production database
docker-compose -f docker-compose.prod.yml exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB

# Run migrations in production
docker-compose -f docker-compose.prod.yml exec backend npm run db:push
```

## 📊 Database Backup & Restore

### Backup Database

```bash
# Development
docker-compose exec postgres pg_dump -U outsourcex_user -d outsourcex_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Production
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > backup_prod_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
# Development
docker-compose exec -T postgres psql -U outsourcex_user -d outsourcex_dev < backup_file.sql

# Production
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < backup_prod_file.sql
```

## 🔐 Environment Variables

All required environment variables are listed in `.env.example`. Key variables:

- **DATABASE_URL**: PostgreSQL connection string
- **BETTER_AUTH_SECRET**: Authentication secret (change in production)
- **ACCESS_TOKEN_SECRET**: JWT token secret (change in production)
- **STRIPE_SECRET_KEY**: Stripe API key for payments
- **EMAIL_SENDER_SMTP_***: SMTP configuration for sending emails
- **SUPER_ADMIN_***: Initial super admin credentials

## 🚨 Troubleshooting

### Container won't start

```bash
# Check logs
make dev-logs

# Check if port is already in use
make ps
```

### Database connection refused

```bash
# Ensure database is running
make ps

# Check logs
make dev-logs

# Restart everything
make clean && make dev-up
```

### Prisma client not generated

```bash
docker-compose exec backend npm run db:generate
```

### Port already in use

Change the port in `.env`:

```bash
APP_PORT=3001
DB_PORT=5433
```

### Clean rebuild

```bash
# Remove volumes and containers
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

## 🔄 Performance Optimization

1. **Multi-stage builds**: Reduces final image size
2. **Alpine Linux**: Smaller base image (~5MB vs 150MB+)
3. **Node modules caching**: Leverages Docker cache layers
4. **Health checks**: Monitors container health
5. **Logging**: JSON file logging with rotation in production

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build and push Docker image
  run: docker build -t outsourcex:latest .

- name: Start Docker Compose
  run: docker-compose -f docker-compose.prod.yml up -d

- name: Run migrations
  run: docker-compose -f docker-compose.prod.yml exec backend npm run db:push
```

## 📝 Notes

- Always use `.env` files for sensitive data (never commit them)
- Development volumes allow hot-reload; changes reflect immediately
- Production images don't include dev dependencies
- Adminer is optional; remove the service in `.env` if not needed
- Ensure ports 3000 and 5432 are available before starting
- Database backups should be automated in production

## 🆘 Support

For issues or questions:

1. Check the logs: `docker-compose logs <service-name>`
2. Verify environment variables: `docker-compose config`
3. Ensure Docker is running: `docker --version`
4. Check port availability: `netstat -tuln | grep 3000`

### Related Documentation

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Documentation](https://docs.docker.com/compose)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Documentation](https://expressjs.com)
- [Deployment Guide](deployment.md)