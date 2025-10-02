#!/bin/bash
# Emergency diagnostic and fix script

echo "🚨 EMERGENCY FIX: Step-by-step diagnosis"
echo "========================================"

cd /var/www/sm-admin-wa-new

# 1. Stop PM2
echo "1️⃣ Stopping PM2..."
pm2 stop all

# 2. Pull latest
echo "2️⃣ Pulling latest fixes..."
git pull origin main

# 3. Clean everything
echo "3️⃣ Complete clean..."
rm -rf .next node_modules package-lock.json

# 4. Fresh install
echo "4️⃣ Fresh install..."
npm install

# 5. Build without production env to test
echo "5️⃣ Building in development mode first..."
NODE_ENV=development npm run build

# 6. Test development build
echo "6️⃣ Starting temporary dev server to test..."
NODE_ENV=development npm start &
DEV_PID=$!

sleep 10

echo "Testing development server:"
curl -sI http://localhost:3000/ | head -1
curl -sI http://localhost:3000/login | head -1
curl -sI http://localhost:3000/admin | head -1
curl -sI http://localhost:3000/api/health | head -1

# Kill dev server
kill $DEV_PID 2>/dev/null

# 7. Now try production build
echo "7️⃣ Building for production..."
rm -rf .next
NODE_ENV=production npm run build

# 8. Start PM2
echo "8️⃣ Starting PM2..."
pm2 start ecosystem.config.js

# 9. Wait and test
sleep 10

echo "9️⃣ Testing production server:"
echo "Root: $(curl -sI http://localhost:3001/ | head -1)"
echo "Login: $(curl -sI http://localhost:3001/login | head -1)"
echo "Admin: $(curl -sI http://localhost:3001/admin | head -1)"
echo "Health: $(curl -sI http://localhost:3001/api/health | head -1)"

# 10. Test through nginx
echo "🔟 Testing through nginx:"
echo "Root: $(curl -sI https://wecare.techconnect.co.id/sm-admin/ | head -1)"
echo "Login: $(curl -sI https://wecare.techconnect.co.id/sm-admin/login | head -1)"

echo ""
echo "📋 PM2 Status:"
pm2 status

echo ""
echo "📜 Recent PM2 Logs:"
pm2 logs --lines 10

echo ""
echo "If development worked but production didn't, there's an environment issue."
echo "If both failed, there's a Next.js configuration issue."