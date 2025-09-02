#!/bin/bash

# BeforeInstall script for CodeDeploy
# This script runs before the application files are installed

set -e

echo "Starting BeforeInstall script..."

# Ensure minimal swap is available to prevent OOM during dependency install/build
if [ -f /proc/meminfo ]; then
    TOTAL_SWAP=$(grep -i '^SwapTotal:' /proc/meminfo | awk '{print $2}')
    # If swap is less than ~512MB (524288 kB), create a 2G swapfile
    if [ -z "$TOTAL_SWAP" ] || [ "$TOTAL_SWAP" -lt 524288 ]; then
        echo "Configuring 2G swapfile at /swapfile..."
        sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile || true
        # Make persistent if not already present
        if ! grep -q '^/swapfile ' /etc/fstab; then
            echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
        fi
        # Reduce swappiness to prefer RAM
        if [ -w /proc/sys/vm/swappiness ]; then
            echo 10 | sudo tee /proc/sys/vm/swappiness >/dev/null || true
        fi
    else
        echo "Swap already present (kB): $TOTAL_SWAP"
    fi
fi

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