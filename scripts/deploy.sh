#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/nestjs-playground
ENV_FILE="$APP_DIR/.env.runtime"

DEPLOY_COMMIT="${1:?Supply a Git commit SHA}"

if [[ ! "$DEPLOY_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid Git commit SHA"
  exit 1
fi

cd "$APP_DIR"

# Update the selected application version
sed -i \
  "s/^DEPLOY_COMMIT=.*/DEPLOY_COMMIT=$DEPLOY_COMMIT/" \
  "$ENV_FILE"

# Read the hostname from runtime configuration
PUBLIC_HOSTNAME=$(
  grep '^PUBLIC_HOSTNAME=' "$ENV_FILE" |
  cut -d= -f2-
)

if [[ -z "$PUBLIC_HOSTNAME" ]]; then
  echo "PUBLIC_HOSTNAME is missing"
  exit 1
fi

echo "Validating Compose configuration..."
docker compose \
  --env-file "$ENV_FILE" \
  -f compose.prod.yaml \
  config --quiet

echo "Pulling application image..."
docker compose \
  --env-file "$ENV_FILE" \
  -f compose.prod.yaml \
  pull api

echo "Deploying application..."
docker compose \
  --env-file "$ENV_FILE" \
  -f compose.prod.yaml \
  up -d --no-deps api

echo "Checking readiness..."
for attempt in {1..30}; do
  if curl --fail --silent --show-error \
    "https://${PUBLIC_HOSTNAME}/health/ready" \
    -o /dev/null; then
    echo "Deployment healthy: $DEPLOY_COMMIT"
    exit 0
  fi

  sleep 3
done

echo "Deployment readiness check failed"
exit 1