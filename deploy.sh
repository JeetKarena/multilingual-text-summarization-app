#!/bin/bash

# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose if not already installed
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# Set environment variables
export DB_PASSWORD=$(openssl rand -base64 16)
export SESSION_SECRET=$(openssl rand -base64 32)

# Copy production docker-compose file
cp docker-compose.prod.yml docker-compose.yml

# Start the application
docker-compose up -d

echo "Application deployed successfully!"
echo "Database password: $DB_PASSWORD"
echo "Please save these credentials securely."