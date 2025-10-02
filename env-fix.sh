#!/bin/bash
# Add missing environment variables to existing .env.production

echo "🔧 Adding missing environment variables to .env.production"
echo "========================================================="

cd /var/www/sm-admin-wa-new

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    exit 1
fi

# Add missing variables only if they don't exist
echo "Adding missing environment variables..."

# Check and add SSL setting
if ! grep -q "DB_SSL=" .env.production; then
    echo "DB_SSL=false" >> .env.production
    echo "✅ Added DB_SSL"
fi

# Check and add Google Sheets settings
if ! grep -q "GOOGLE_SHEETS_DEFAULT_SHEET_ID=" .env.production; then
    echo "" >> .env.production
    echo "# Google Sheets Configuration" >> .env.production
    echo "GOOGLE_SHEETS_DEFAULT_SHEET_ID=1BmvRMqcDl_j0k2nHZhEcWj_QjZbqBpjLc4p5MNKxNNU" >> .env.production
    echo "GOOGLE_SHEETS_CC_BENEFIT_TAB_ID=333075918" >> .env.production
    echo "✅ Added Google Sheets configuration"
fi

# Check and add authentication secrets
if ! grep -q "JWT_SECRET=" .env.production; then
    echo "" >> .env.production
    echo "# Authentication" >> .env.production
    echo "JWT_SECRET=sm_admin_jwt_secret_2025_production" >> .env.production
    echo "NEXTAUTH_SECRET=sm_admin_nextauth_secret_2025_production" >> .env.production
    echo "✅ Added authentication secrets"
fi

# Check and add admin credentials
if ! grep -q "ADMIN_EMAIL=" .env.production; then
    echo "" >> .env.production
    echo "# Admin Credentials" >> .env.production
    echo "ADMIN_EMAIL=hris@sinarmasmining.com" >> .env.production
    echo "ADMIN_PASSWORD=admin123" >> .env.production
    echo "✅ Added admin credentials"
fi

# Check and add API URL
if ! grep -q "NEXT_PUBLIC_API_URL=" .env.production; then
    echo "" >> .env.production
    echo "# API Configuration" >> .env.production
    echo "NEXT_PUBLIC_API_URL=https://wecare.techconnect.co.id/sm-admin" >> .env.production
    echo "NEXTAUTH_URL=https://wecare.techconnect.co.id/sm-admin" >> .env.production
    echo "✅ Added API configuration"
fi

echo ""
echo "📋 Current .env.production content:"
echo "=================================="
cat .env.production

echo ""
echo "🚀 Rebuilding and restarting application..."

# Stop PM2
pm2 stop all

# Copy to .env
cp .env.production .env

# Clean rebuild
rm -rf .next
NODE_ENV=production npm run build

# Start PM2
pm2 start ecosystem.config.js

# Wait and test
sleep 10

echo ""
echo "🧪 Testing application:"
echo "Root: $(curl -sI http://localhost:3001/ | head -1)"
echo "Health: $(curl -sI http://localhost:3001/api/health | head -1)"

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📜 PM2 Logs (last 10 lines):"
pm2 logs --lines 10