
#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/nestjs-playground
ENV_FILE="$APP_DIR/.env.runtime"
COMPOSE_FILE="$APP_DIR/compose.prod.yaml"

NEW_COMMIT="${1:?Supply a Git commit SHA}"

if [[ ! "$NEW_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid Git commit SHA"
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "Run this script with sudo"
  exit 1
fi

cd "$APP_DIR"

OLD_COMMIT=$(
  grep '^DEPLOY_COMMIT=' "$ENV_FILE" |
  tail -1 | cut -d= -f2-
)

PUBLIC_HOSTNAME=$(
  grep '^PUBLIC_HOSTNAME=' "$ENV_FILE" |
  tail -1 | cut -d= -f2-
)

if [[ ! "$OLD_COMMIT" =~ ^[0-9a-f]{40}$ ]] ||
   [[ -z "$PUBLIC_HOSTNAME" ]]; then
  echo "Invalid existing deployment configuration"
  exit 1
fi

compose() {
  docker compose \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" "$@"
}

# Replace the version atomically, retaining restricted permissions.
set_version() {
  local temp
  temp=$(mktemp "${ENV_FILE}.XXXXXX")
  chmod 600 "$temp"

  sed '/^DEPLOY_COMMIT=/d' "$ENV_FILE" > "$temp"
  printf 'DEPLOY_COMMIT=%s\n' "$1" >> "$temp"

  mv -f "$temp" "$ENV_FILE"
}

check_readiness() {
  for attempt in {1..15}; do
    if curl --fail --silent \
      --connect-timeout 3 --max-time 5 \
      "https://${PUBLIC_HOSTNAME}/health/ready" \
      -o /dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}

echo "Current: $OLD_COMMIT"
echo "Candidate: $NEW_COMMIT"

echo "Validating candidate configuration..."
DEPLOY_COMMIT="$NEW_COMMIT" compose config --quiet

echo "Pulling candidate image..."
DEPLOY_COMMIT="$NEW_COMMIT" compose pull api

echo "Switching deployment version..."
set_version "$NEW_COMMIT"

echo "Deploying API..."
if compose up -d --no-deps api && check_readiness; then
  echo "Deployment successful: $NEW_COMMIT"
  exit 0
fi

echo "Deployment failed. Attempting rollback..."

set_version "$OLD_COMMIT"

if compose up -d --no-deps api && check_readiness; then
  echo "Rollback successful: $OLD_COMMIT"
else
  echo "CRITICAL: Rollback failed. Manual intervention required."
fi

exit 1
