# Docker Setup Guide - OutsourceX Backend

This guide explains how to properly use Docker to run the OutsourceX backend application.

## 📋 Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- Git

## 🚀 Quick Start

### Development Environment

1. **Clone the repository and navigate to the project:**
   ```bash
   cd /path/to/OutSourceX
   ```

2. **Create a `.env` file from the example:**
   ```bash
   cp .env.example .env
   ```

3. **Update environment variables in `.env`** if needed (customize for your setup)

4. **Start the development environment:**
   ```bash
   docker-compose up -d
   ```

   This will:
   - Start PostgreSQL database
   - Start the backend API server (with hot-reload)
   - Start Adminer for database management (optional)

5. **Initialize the database (first time only):**
   ```bash
   docker-compose exec backend npm run db:push
   ```

6. **Seed the super admin account (first time only):**
   ```bash
   docker-compose exec backend npm run admin:seed
   ```

7. **Access the application:**
   - API: http://localhost:3000
   - Adminer (database UI): http://localhost:8080
   - Health check: http://localhost:3000/health

### Production Environment

1. **Create a production `.env` file:**
   ```bash
   cp .env.example .env.prod
   # Update with production values
   ```

2. **Build and start production containers:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

3. **Run database migrations:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run db:push
   ```

## 📦 Docker Files Explanation

### `Dockerfile`
- **Multi-stage build** for optimized image size
- **Stage 1 (dependencies):** Installs npm packages
- **Stage 2 (builder):** Compiles TypeScript, generates Prisma client
- **Stage 3 (production):** Final minimal image with only production dependencies
- Uses Alpine Linux for smaller image size (~200MB)
- Includes dumb-init for proper signal handling
- Healthcheck to monitor container status

### `docker-compose.yml` (Development)
- **PostgreSQL 16:** Database service with hot-reload volumes
- **Adminer:** Web UI for database management
- **Backend:** Application with hot-reload (using `npm run dev`)
- **Volumes:** Source code and node_modules mounted
- **Network:** Internal communication between services

### `docker-compose.prod.yml` (Production)
- **PostgreSQL 16:** Database with optimized settings
- **Backend:** Production image (no hot-reload)
- **Logging:** JSON file logging with rotation
- **Restart Policies:** Always restart on failure
- **Backups Volume:** For database backups

### `.dockerignore`
Excludes unnecessary files from the Docker build context to reduce build time and image size.

## 🛠️ Common Commands

### Development Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Run database migrations
docker-compose exec backend npm run db:migrate

# Push Prisma schema to database
docker-compose exec backend npm run db:push

# Access database with Prisma Studio
docker-compose exec backend npm run db:studio

# Seed super admin
docker-compose exec backend npm run admin:seed

# Run linter
docker-compose exec backend npm run lint

# Fix linting issues
docker-compose exec backend npm run lint:fix

# Access database shell
docker-compose exec postgres psql -U outsourcex_user -d outsourcex_dev

# Rebuild Docker image
docker-compose build --no-cache

# Execute npm command
docker-compose exec backend npm install <package-name>
```

### Production Commands

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Stop production stack
docker-compose -f docker-compose.prod.yml down

# View production logs
docker-compose -f docker-compose.prod.yml logs -f backend

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

- **DATABASE_URL:** PostgreSQL connection string
- **BETTER_AUTH_SECRET:** Authentication secret (change in production)
- **ACCESS_TOKEN_SECRET:** JWT token secret (change in production)
- **STRIPE_SECRET_KEY:** Stripe API key for payments
- **EMAIL_SENDER_SMTP_*:** SMTP configuration for sending emails
- **SUPER_ADMIN_*:** Initial super admin credentials

## 🚨 Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Check if port is already in use
docker-compose ps
```

### Database connection refused
```bash
# Ensure database is healthy
docker-compose ps postgres

# Wait for database to start
sleep 10 && docker-compose exec backend npm run db:push
```

### Prisma client not generated
```bash
docker-compose exec backend npx prisma generate
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

## 📈 Performance Optimization

1. **Multi-stage builds:** Reduces final image size
2. **Alpine Linux:** Smaller base image (~5MB vs 150MB+)
3. **Node modules caching:** Leverages Docker cache layers
4. **Health checks:** Monitors container health
5. **Logging:** JSON file logging with rotation in production

## 🔄 CI/CD Integration

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
