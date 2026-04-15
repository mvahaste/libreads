#!/bin/sh

set -e

echo "Running migrations..."
node prisma/migrate.mjs

echo "Seeding database..."
node prisma/seed.mjs

echo "Starting application..."
node server.js
