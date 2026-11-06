#!/bin/bash
set -euo pipefail

# Record bootstrap output for troubleshooting
exec > >(tee -a /var/log/nestjs-bootstrap.log) 2>&1

echo "Starting NestJS instance bootstrap"

# Install Docker and Docker Compose
apt-get update
apt-get install -y \
  docker.io \
  docker-compose-v2 \
  curl \
  ca-certificates \
  openssl

# Start Docker and enable it at boot
systemctl enable --now docker

# Download deployment configuration
APP_DIR=/opt/nestjs-playground
DEPLOY_COMMIT="__DEPLOY_COMMIT__"

mkdir -p "$APP_DIR"

curl --fail --location --show-error \
  "https://github.com/chrisp1985/nestjs-playground/archive/${DEPLOY_COMMIT}.tar.gz" \
  -o /tmp/nestjs-playground.tar.gz

tar -xzf /tmp/nestjs-playground.tar.gz \
  -C "$APP_DIR" \
  --strip-components=1

rm /tmp/nestjs-playground.tar.gz

# Move Compose alongside db/init so relative paths resolve
cp "$APP_DIR/infra/lightsail/compose.prod.yaml" \
   "$APP_DIR/compose.prod.yaml"

# Create runtime credentials with restricted permissions
umask 077

if [ ! -f "$APP_DIR/.env.runtime" ]; then
  DB_PASSWORD="$(openssl rand -hex 32)"
  printf 'DB_PASSWORD=%s\n' "$DB_PASSWORD" \
    > "$APP_DIR/.env.runtime"
fi

chmod 600 "$APP_DIR/.env.runtime"

# Supply the deployment version to Compose
printf 'DEPLOY_COMMIT=%s\n' "$DEPLOY_COMMIT" \
  >> "$APP_DIR/.env.runtime"

# Start the application
cd "$APP_DIR"

docker compose \
  --env-file .env.runtime \
  -f compose.prod.yaml \
  pull

docker compose \
  --env-file .env.runtime \
  -f compose.prod.yaml \
  up -d

echo "Application containers started"