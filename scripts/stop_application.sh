#!/bin/bash

# ApplicationStop script for CodeDeploy
# This script runs to stop the application before deployment

set -e
# Suppress stdout to reduce CodeDeploy log size; keep stderr for errors
exec 1>/dev/null

echo "Starting ApplicationStop script..."

# Navigate to application directory
cd /home/ubuntu/debuggers-backend

# Stop the application using pm2
if command -v pm2 &> /dev/null; then
    echo "Stopping debuggers-backend with pm2..."
    pm2 stop debuggers-backend || true
    pm2 delete debuggers-backend || true
    echo "✅ Application stopped successfully"
else
    echo "pm2 not found, skipping pm2 stop"
fi

# Kill any remaining Node.js processes (fallback)
if pgrep -f "node.*dist/main" > /dev/null; then
    echo "Killing remaining Node.js processes..."
    sudo pkill -f "node.*dist/main" || true
    sleep 2
fi

echo "ApplicationStop script completed successfully." 