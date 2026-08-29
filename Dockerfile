# Stage 1: Build dependencies and compiled application
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://localhost:5432/outsourcex npx prisma generate
RUN npm run build

# Stage 2: Runtime dependencies and application
FROM node:22-alpine AS production
WORKDIR /app

# Install dumb-init, curl, and netcat for healthcheck and db wait
RUN apk add --no-cache dumb-init curl netcat-openbsd

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
# EJS files are loaded from src/app/templates at runtime.
COPY --from=builder /app/src/app/templates ./src/app/templates

# Set environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"
ENV DB_HOST=postgres
ENV DB_PORT=5432

# Expose port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run with dumb-init to handle signals properly
ENTRYPOINT ["/sbin/dumb-init", "--", "/app/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
