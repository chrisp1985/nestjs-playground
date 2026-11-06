
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Fetching latest code..."
git fetch origin main

echo "Checking for uncommitted changes..."
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Aborting."
  exit 1
fi

echo "Updating repository..."
git merge --ff-only origin/main

echo "Validating Docker Compose..."
sudo docker compose \
  -f docker-compose.prod.yml \
  config --quiet

echo "Building and deploying NestJS..."
sudo docker compose \
  -f docker-compose.prod.yml \
  up -d --build --no-deps api

echo "Checking readiness..."
for attempt in {1..15}; do
  if curl --fail --silent \
    https://35-178-124-114.sslip.io/health/ready \
    > /dev/null; then
    echo "Deployment healthy!"
    exit 0
  fi

  sleep 2
done

echo "Deployment readiness check failed."
exit 1
