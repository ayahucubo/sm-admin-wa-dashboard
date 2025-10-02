#!/bin/bash
# Ultimate fix - direct approach without any complex configuration

echo "🎯 ULTIMATE FIX: Direct approach"
echo "================================"

cd /var/www/sm-admin-wa-new

# 1. Stop everything
pm2 stop all

# 2. Use the simplest possible setup
echo "Creating minimal ecosystem config..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sm-admin-wa-dashboard',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: '/var/www/sm-admin-wa-new',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# 3. Create the simplest nginx config
echo "Creating direct nginx config..."
cat > direct-nginx.conf << 'EOF'
server {
    listen 80;
    server_name wecare.techconnect.co.id;

    # Direct proxy to Next.js - no rewriting
    location /sm-admin {
        return 301 /sm-admin/;
    }
    
    location /sm-admin/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Keep other locations as they are
    location / {
        proxy_pass http://localhost:5688;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
EOF

# 4. Test local app first
echo "Testing if local Next.js app works..."
echo "Root page test:"
timeout 5 curl -sI http://localhost:3001/ || echo "Local root failed"

echo "Health API test:"  
timeout 5 curl -s http://localhost:3001/api/health || echo "Local API failed"

# 5. If local doesn't work, try different port
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "Port 3001 not working, trying to start manually..."
    
    # Kill anything on port 3001
    fuser -k 3001/tcp 2>/dev/null || true
    
    # Start manually and test
    PORT=3001 NODE_ENV=production npm start &
    MANUAL_PID=$!
    
    sleep 10
    
    echo "Manual start test:"
    curl -sI http://localhost:3001/ | head -1
    curl -sI http://localhost:3001/api/health | head -1
    
    kill $MANUAL_PID 2>/dev/null || true
fi

# 6. Start with PM2
echo "Starting with PM2..."
pm2 start ecosystem.config.js

sleep 5

# 7. Final tests
echo "Final test results:"
echo "Local root: $(curl -sI http://localhost:3001/ 2>/dev/null | head -1 || echo 'FAILED')"
echo "Local API: $(curl -sI http://localhost:3001/api/health 2>/dev/null | head -1 || echo 'FAILED')"

pm2 status