#!/bin/bash

# ApplicationStop script for CodeDeploy
# This script runs to stop the application before deployment

set -e

echo "Starting ApplicationStop script..."

# Stop the application using systemd
if sudo systemctl is-active --quiet debuggers-backend.service; then
    echo "Stopping debuggers-backend service..."
    sudo systemctl stop debuggers-backend.service
    
    # Wait for the service to stop
    sleep 5
    
    # Check if the service has stopped
    if sudo systemctl is-active --quiet debuggers-backend.service; then
        echo "❌ Failed to stop application"
        sudo systemctl status debuggers-backend.service --no-pager
        exit 1
    else
        echo "✅ Application stopped successfully"
    fi
else
    echo "Application is not running, skipping stop"
fi

# Kill any remaining Node.js processes (fallback)
if pgrep -f "node.*dist/main" > /dev/null; then
    echo "Killing remaining Node.js processes..."
    sudo pkill -f "node.*dist/main" || true
    sleep 2
fi

echo "ApplicationStop script completed successfully." 