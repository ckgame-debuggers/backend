#!/bin/bash

# ApplicationStart script for CodeDeploy
# This script runs to start the application

set -e

echo "Starting ApplicationStart script..."

# Start the application using systemd
echo "Starting debuggers-backend service..."
sudo systemctl start debuggers-backend.service

# Wait a moment for the service to start
sleep 5

# Check if the service is running
if sudo systemctl is-active --quiet debuggers-backend.service; then
    echo "✅ Application started successfully!"
    
    # Get service status
    sudo systemctl status debuggers-backend.service --no-pager
    
    # Check if the application is responding
    echo "Checking application health..."
    for i in {1..10}; do
        if curl -f http://localhost:8000 > /dev/null 2>&1; then
            echo "✅ Application is responding on port 8000"
            break
        else
            echo "Waiting for application to start... (attempt $i/10)"
            sleep 3
        fi
    done
    
    # Final health check
    if curl -f http://localhost:8000 > /dev/null 2>&1; then
        echo "✅ Application deployment completed successfully!"
    else
        echo "❌ Application is not responding after deployment"
        sudo journalctl -u debuggers-backend.service --no-pager -n 50
        exit 1
    fi
else
    echo "❌ Failed to start application"
    sudo systemctl status debuggers-backend.service --no-pager
    sudo journalctl -u debuggers-backend.service --no-pager -n 50
    exit 1
fi

echo "ApplicationStart script completed successfully." 