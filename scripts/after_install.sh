#!/bin/bash

# AfterInstall script for CodeDeploy
# This script runs after the application files are installed

set -e

echo "Starting AfterInstall script..."

# Navigate to application directory
cd /home/ubuntu/debuggers-backend

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build the application
echo "Building application..."
pnpm run build

# Set proper permissions for the built application
sudo chown -R ubuntu:ubuntu /home/ubuntu/debuggers-backend
sudo chmod -R 755 /home/ubuntu/debuggers-backend

# Create logs directory
sudo mkdir -p /var/log/debuggers-backend
sudo chown ubuntu:ubuntu /var/log/debuggers-backend

# Create systemd service file
sudo tee /etc/systemd/system/debuggers-backend.service > /dev/null <<EOF
[Unit]
Description=Debuggers Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/debuggers-backend
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable debuggers-backend.service

echo "AfterInstall script completed successfully." 