#!/bin/bash

# BeforeInstall script for CodeDeploy
# This script runs before the application files are installed

set -e

echo "Starting BeforeInstall script..."

# Create application directory if it doesn't exist
sudo mkdir -p /home/ubuntu/debuggers-backend

# Set proper permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/debuggers-backend
sudo chmod -R 755 /home/ubuntu/debuggers-backend

# Stop existing application if running
if pgrep -f "node.*dist/main" > /dev/null; then
    echo "Stopping existing application..."
    sudo pkill -f "node.*dist/main" || true
fi

# Clean up old deployment if exists
if [ -d "/home/ubuntu/debuggers-backend/old" ]; then
    echo "Removing old deployment..."
    sudo rm -rf /home/ubuntu/debuggers-backend/old
fi

# Backup current deployment if exists
if [ -d "/home/ubuntu/debuggers-backend/current" ]; then
    echo "Backing up current deployment..."
    sudo mv /home/ubuntu/debuggers-backend/current /home/ubuntu/debuggers-backend/old
fi

echo "BeforeInstall script completed successfully." 