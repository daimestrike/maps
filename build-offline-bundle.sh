#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

platform="${1:-linux/amd64}"
output="${2:-maps-offline-linux-amd64.tar.gz}"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

docker buildx build --platform "$platform" --load -t maps-app:offline .
docker pull --platform "$platform" postgres:17-alpine
docker save maps-app:offline postgres:17-alpine | gzip -1 > "$work_dir/images.tar.gz"
cp compose.prod.yaml deploy.sh .env.production.example OFFLINE-README.md "$work_dir/"
chmod +x "$work_dir/deploy.sh"
tar -C "$work_dir" -czf "$output" .
echo "Created $output"
