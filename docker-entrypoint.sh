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

echo "✨ Ready! Starting server..."
exec "$@"
