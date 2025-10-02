#!/bin/bash
# Quick fix for the @tailwindcss/postcss dependency issue

echo "🔧 Quick Fix: Installing missing dependencies"
echo "============================================="

cd /var/www/sm-admin-wa-new

# Stop PM2 processes
echo "⏹️ Stopping PM2..."
pm2 stop all

# Install missing dependencies
echo "📦 Installing missing Tailwind dependencies..."
npm install @tailwindcss/postcss tailwindcss typescript @types/node @types/react @types/react-dom

# Try to build
echo "🔨 Attempting build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Start PM2
    echo "▶️ Starting PM2..."
    pm2 start ecosystem.config.js
    
    # Test
    sleep 5
    curl -f http://localhost:3001/api/health && echo "✅ Application is running!" || echo "❌ Application failed to start"
else
    echo "❌ Build failed - check the error messages above"
fi

pm2 status