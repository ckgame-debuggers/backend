#!/bin/bash

# ApplicationStart script for CodeDeploy
# This script runs to start the application

set -e
cd /home/ubuntu/debuggers-backend

echo "Starting ApplicationStart script..."

# pm2로 앱 실행
pm2 start dist/main.js --name debuggers-backend

# pm2 상태 확인
pm2 status

# 헬스 체크 (필요시)
for i in {1..10}; do
    if curl -f http://localhost:8000 > /dev/null 2>&1; then
        echo "✅ Application is responding on port 8000"
        break
    else
        echo "Waiting for application to start... (attempt $i/10)"
        sleep 3
    fi
done 