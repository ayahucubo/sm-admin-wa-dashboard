#!/bin/bash
# Complete server startup fix

echo "🔧 COMPLETE SERVER STARTUP FIX"
echo "=============================="

cd /var/www/sm-admin-wa-new

# 1. Stop everything and clean up
echo "1️⃣ Cleaning up processes..."
pm2 stop all
pm2 delete all
sudo fuser -k 3001/tcp 2>/dev/null || true
sudo fuser -k 3000/tcp 2>/dev/null || true

# 2. Check what's using the ports
echo "2️⃣ Checking port usage..."
echo "Port 3001: $(sudo netstat -tlnp | grep :3001 || echo 'Free')"
echo "Port 3000: $(sudo netstat -tlnp | grep :3000 || echo 'Free')"

# 3. Create simple working environment
echo "3️⃣ Creating minimal environment..."
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5488
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=n8nuser
DB_POSTGRESDB_PASSWORD=P0stgres99
DB_N8N_HOST=localhost
DB_N8N_PORT=5488
DB_N8N_DATABASE=n8ndb
DB_N8N_USER=n8nuser
DB_N8N_PASSWORD=P0stgres99
EOF

# 4. Create simple PM2 config without complex settings
echo "4️⃣ Creating simple PM2 config..."
cat > ecosystem.simple.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sm-admin-simple',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/sm-admin-wa-new',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    max_restarts: 3,
    min_uptime: '10s'
  }]
};
EOF

# 5. Test manual startup first
echo "5️⃣ Testing manual startup..."
timeout 15s npm start &
START_PID=$!

sleep 10

if ps -p $START_PID > /dev/null 2>&1; then
    echo "✅ Manual start successful!"
    
    # Test if server responds
    sleep 2
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo "✅ Server responds to requests!"
    else
        echo "⚠️ Server started but not responding to requests"
    fi
    
    kill $START_PID 2>/dev/null
else
    echo "❌ Manual start failed"
    echo "Checking error output..."
fi

# 6. Try with PM2 simple config
echo "6️⃣ Starting with PM2 simple config..."
pm2 start ecosystem.simple.js

sleep 10

# 7. Test results
echo "7️⃣ Testing results..."
echo "PM2 Status:"
pm2 status

echo ""
echo "Server tests:"
echo "Health API: $(timeout 5s curl -sI http://localhost:3001/api/health 2>/dev/null | head -1 || echo 'FAILED')"
echo "Root page: $(timeout 5s curl -sI http://localhost:3001/ 2>/dev/null | head -1 || echo 'FAILED')"

# 8. Show recent logs
echo ""
echo "8️⃣ Recent logs:"
pm2 logs --lines 10

echo ""
echo "🎯 If this worked, your app should now be accessible at:"
echo "   http://localhost:3001/"
echo "   https://wecare.techconnect.co.id/sm-admin/"