
#!/bin/bash
set -euo pipefail

# Record bootstrap output for troubleshooting
exec > >(tee -a /var/log/nestjs-bootstrap.log) 2>&1

echo "Starting NestJS instance bootstrap"

# Install Docker and Docker Compose
apt-get update
apt-get install -y docker.io docker-compose-v2

# Start Docker and enable it at boot
systemctl enable --now docker

# Create application deployment directory
mkdir -p /opt/nestjs-playground

echo "Bootstrap completed"
