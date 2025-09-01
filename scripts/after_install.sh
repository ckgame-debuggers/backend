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
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -y
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
        sudo yum install -y nodejs
    fi
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
pnpm install --no-frozen-lockfile

# Rebuild native modules for current architecture
# Skipping pnpm rebuild to shorten AfterInstall time and avoid long hangs

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

# --- Ensure cron is installed, enabled, and cleanup job is registered ---
echo "Configuring cron for CodeDeploy archive cleanup..."

# Detect package manager and cron service name
CRON_SERVICE=""
if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    if ! dpkg -s cron &> /dev/null; then
        echo "Installing cron..."
        sudo apt-get update -y
        sudo apt-get install -y cron
    fi
    CRON_SERVICE="cron"
elif command -v yum &> /dev/null; then
    # RHEL/CentOS/Amazon Linux
    if ! rpm -q cronie &> /dev/null; then
        echo "Installing cronie..."
        sudo yum install -y cronie
    fi
    CRON_SERVICE="crond"
fi

# Enable and start cron service
if [ -n "$CRON_SERVICE" ]; then
    if command -v systemctl &> /dev/null; then
        sudo systemctl enable --now "$CRON_SERVICE" || true
        sudo systemctl restart "$CRON_SERVICE" || true
    else
        sudo service "$CRON_SERVICE" start || true
        sudo service "$CRON_SERVICE" restart || true
    fi
fi

# Register daily cleanup job (idempotent)
sudo bash -c 'cat > /etc/cron.d/codedeploy-clean <<"EOF"\
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# Daily 3AM: remove CodeDeploy archives older than 7 days
0 3 * * * root find /opt/codedeploy-agent/deployment-root/deployment-archive -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +
EOF'
sudo chmod 644 /etc/cron.d/codedeploy-clean || true
sudo chown root:root /etc/cron.d/codedeploy-clean || true

# Reload cron to pick up new job
if [ -n "$CRON_SERVICE" ]; then
    if command -v systemctl &> /dev/null; then
        sudo systemctl restart "$CRON_SERVICE" || true
    else
        sudo service "$CRON_SERVICE" restart || true
    fi
fi

echo "Cron configuration completed."