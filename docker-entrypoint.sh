#!/bin/sh
set -eu

echo "Applying database migrations..."
./node_modules/.bin/prisma migrate deploy
echo "Checking initial data..."
./node_modules/.bin/tsx prisma/seed.ts
echo "Starting X5 store map..."
exec ./node_modules/.bin/next start
