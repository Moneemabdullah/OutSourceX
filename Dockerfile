# Stage 1: Dependencies stage
FROM node:22-alpine as dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build stage
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
RUN npm ci
RUN npx prisma generate --schema=./prisma/schema/schema.prisma
RUN npm run build

# Stage 3: Production stage
FROM node:22-alpine
WORKDIR /app

# Install dumb-init, curl, and netcat for healthcheck and db wait
RUN apk add --no-cache dumb-init curl netcat-openbsd

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Copy only necessary files from dependencies and builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

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