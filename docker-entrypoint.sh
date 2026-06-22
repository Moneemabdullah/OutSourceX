#!/bin/sh

# Docker entrypoint script for OutsourceX backend
# This script handles initialization tasks before starting the server

set -e

echo "🚀 Starting OutsourceX Backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
while ! nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "✅ PostgreSQL is ready!"

# Run Prisma generate to create the client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations if DATABASE_AUTO_MIGRATE is set to true
if [ "${DATABASE_AUTO_MIGRATE}" = "true" ]; then
  echo "📦 Running database migrations..."
  npx prisma db push --skip-generate
fi

# Run database migrations if we're in development
if [ "${NODE_ENV}" = "development" ]; then
  echo "📦 Running database push in development..."
  npx prisma db push --skip-generate
fi

echo "✨ Ready! Starting server..."
exec "$@"
