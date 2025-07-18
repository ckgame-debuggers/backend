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
    sudo npm install -g pnpm
fi

# Clean previous installations
echo "Cleaning previous installations..."
rm -rf node_modules
rm -rf dist

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Rebuild native modules for current architecture
echo "Rebuilding native modules..."
pnpm rebuild

# Build the application
echo "Building application..."
pnpm run build

# Set proper permissions for the built application
sudo chown -R ubuntu:ubuntu /home/ubuntu/debuggers-backend
sudo chmod -R 755 /home/ubuntu/debuggers-backend

# Create logs directory
sudo mkdir -p /var/log/debuggers-backend
sudo chown ubuntu:ubuntu /var/log/debuggers-backend

# Install pm2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing pm2..."
    sudo npm install -g pm2
fi

echo "AfterInstall script completed successfully." 