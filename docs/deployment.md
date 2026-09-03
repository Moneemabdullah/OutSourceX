# 🚀 Deployment Guide - OutsourceX

This guide covers production deployment of the OutsourceX backend application.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables are set correctly in `.env.prod`
- [ ] Database backups are configured
- [ ] SSL/TLS certificates are ready (if using custom domain)
- [ ] Monitoring and logging are configured
- [ ] Secrets are stored securely (use AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Reverse proxy (Nginx/Traefik) is configured
- [ ] All tests pass locally
- [ ] Code is pushed and CI/CD pipeline passes

## � Environment Setup

### Create Production .env File

```bash
cp .env.example .env.prod
```

Update with production values:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database (Use managed database if possible)
DATABASE_URL=postgresql://prod_user:SecurePassword@db.example.com:5432/outsourcex_prod
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=SecurePassword
POSTGRES_DB=outsourcex_prod

# Authentication (Generate new secrets for production)
BETTER_AUTH_SECRET=your-production-secret-key-32-chars-minimum
BETTER_AUTH_URL=https://api.yourapp.com
ACCESS_TOKEN_SECRET=your-production-access-token-secret
REFRESH_TOKEN_SECRET=your-production-refresh-token-secret

# Email Configuration (SMTP)
EMAIL_SENDER_SMTP_HOST=smtp.example.com
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_USER=your-email@example.com
EMAIL_SENDER_SMTP_PASS=your-email-password
EMAIL_SENDER_FROM=noreply@example.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/callback/google

# Frontend URL (CORS)
FRONTEND_URL=https://yourdomain.com

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (Optional)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Super Admin
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=SecurePassword123!
```

## 🐳 Docker Production Deployment

### Using Docker Compose

```bash
# Start production stack
make prod-up

# Stop production stack
make prod-down

# View production logs
make prod-logs
```

### Single Server Deployment

```bash
# 1. Copy production env file to server
scp .env.prod user@your-server.com:/app/outsourcex/

# 2. SSH into your server
ssh user@your-server.com

# 3. Clone repository (if not already)
git clone https://github.com/yourusername/outsourcex.git
cd outsourcex

# 3. Start services
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run db:push
```

### Docker Swarm Deployment

```bash
# Initialize swarm
docker swarm init

# Deploy service
docker stack deploy -c docker-compose.prod.yml outsourcex

# Check deployment
docker stack ps outsourcex
```

### Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests.

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment
kubectl get pods -n outsourcex
kubectl logs -n outsourcex -l app=backend
```

## ⚙️ Reverse Proxy Setup (Nginx)

Create `/etc/nginx/sites-available/outsourcex`:

```nginx
upstream backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.yourapp.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourapp.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/outsourcex /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## 🗄️ Database Management

### Backup Strategy

```bash
# Daily backup script (/usr/local/bin/backup-db.sh)
#!/bin/bash
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -type f -name "backup_*.sql.gz" -mtime +30 -delete
```

Schedule with cron:

```bash
0 2 * * * /usr/local/bin/backup-db.sh
```

### Restore Database

```bash
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < backup_file.sql
```

## 📊 Monitoring & Logging

### Container Logging

```bash
# View logs
make prod-logs

# Follow logs
make prod-logs -f
```

### Health Monitoring

```bash
# Check container health
make ps

# Monitor system resources
docker stats
```

## ⚡ Scaling

### Horizontal Scaling with Load Balancer

```yaml
# docker-compose.prod.yml with multiple backend instances
version: '3.9'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend-1
      - backend-2
      - backend-3

  backend-1:
    # Backend configuration

  backend-2:
    # Backend configuration

  backend-3:
    # Backend configuration
```

## 🔒 Security Best Practices

1. **Secrets Management**:
   - Never commit `.env.prod` file
   - Use environment variables from secure storage
   - Rotate secrets regularly

2. **Network Security**:
   - Use firewall rules to restrict access
   - Enable SSL/TLS (HTTPS only)
   - Rate limiting on API endpoints

3. **Database Security**:
   - Strong passwords (30+ characters)
   - Regular backups with encryption
   - Enable database backup verification

4. **Container Security**:
   - Run containers as non-root user
   - Use read-only file systems where possible
   - Scan images for vulnerabilities

5. **Monitoring**:
   - Enable container logging
   - Monitor resource usage
   - Set up alerts for failures

## ⚠️ Troubleshooting

### Container won't start

```bash
docker-compose -f docker-compose.prod.yml logs backend
```

### Database connection issues

```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U $POSTGRES_USER -c "SELECT 1;"
```

### High memory usage

```bash
docker stats --no-stream
docker system prune -a  # Clean up unused images
```

### Disk space issues

```bash
docker system df
docker image prune -a --filter "until=72h"
```

## 📅 Maintenance

### Regular Tasks

- [ ] Weekly: Review logs for errors
- [ ] Weekly: Monitor resource usage
- [ ] Monthly: Rotate secrets and credentials
- [ ] Monthly: Test backup restoration
- [ ] Quarterly: Update Docker and dependencies
- [ ] Quarterly: Security audit

### Update Checklist

1. Test updates in staging environment
2. Create database backup
3. Update and restart services
4. Verify health check passes
5. Monitor logs for errors
6. Keep rollback plan ready

## 📞 Support & Documentation

- Docker Docs: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose
- Prisma Docs: https://www.prisma.io/docs
- Express Docs: https://expressjs.com
- Code of Conduct: (link)

### Related Documentation

- [Docker Guide](docker.md) - Docker setup and commands
- [README.md](README.md) - Project overview and setup