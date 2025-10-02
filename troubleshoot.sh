#!/bin/bash
# Troubleshooting Script untuk SM Admin WA Dashboard
# Jalankan script ini di server untuk diagnosa masalah

echo "🔍 SM Admin WA Dashboard - Troubleshooting"
echo "========================================"

# 1. Check current directory and files
echo "📁 Current directory: $(pwd)"
echo "📋 Files in current directory:"
ls -la

# 2. Check if .env file exists and has correct content
echo ""
echo "🔧 Environment Configuration:"
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "Environment variables (without sensitive data):"
    grep -E "^(NODE_ENV|PORT|DB_TYPE)" .env || echo "❌ Missing basic environment variables"
else
    echo "❌ .env file not found!"
fi

# 3. Check Node.js and npm versions
echo ""
echo "🟢 Node.js Information:"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# 4. Check if dependencies are installed
echo ""
echo "📦 Dependencies:"
if [ -d node_modules ]; then
    echo "✅ node_modules directory exists"
    echo "Next.js version: $(npm list next --depth=0 2>/dev/null || echo 'Not found')"
else
    echo "❌ node_modules directory not found!"
fi

# 5. Check if build exists
echo ""
echo "🔨 Build Status:"
if [ -d .next ]; then
    echo "✅ .next build directory exists"
    ls -la .next/
else
    echo "❌ .next build directory not found!"
fi

# 6. Check PM2 status
echo ""
echo "⚡ PM2 Status:"
pm2 status
echo ""
echo "PM2 logs (last 20 lines):"
pm2 logs sm-admin-wa-dashboard --lines 20 --nostream 2>/dev/null || echo "No PM2 logs found"

# 7. Test local application
echo ""
echo "🌐 Application Health Check:"
echo "Testing localhost:3001..."
curl -f http://localhost:3001/api/health 2>/dev/null && echo "✅ Health check passed" || echo "❌ Health check failed"

echo ""
echo "Testing localhost:3001/api/debug..."
curl -f http://localhost:3001/api/debug 2>/dev/null && echo "✅ Debug endpoint accessible" || echo "❌ Debug endpoint failed"

# 8. Check database connectivity
echo ""
echo "🗄️ Database Connectivity:"
echo "Testing PostgreSQL connection..."
PGPASSWORD=P0stgres99 psql -h localhost -p 5488 -U n8nuser -d postgres -c "SELECT 1;" 2>/dev/null && echo "✅ PostgreSQL connection successful" || echo "❌ PostgreSQL connection failed"

echo ""
echo "Testing N8N database..."
PGPASSWORD=P0stgres99 psql -h localhost -p 5488 -U n8nuser -d n8ndb -c "SELECT COUNT(*) FROM execution_metadata LIMIT 1;" 2>/dev/null && echo "✅ N8N database accessible" || echo "❌ N8N database connection failed"

# 9. Check nginx configuration
echo ""
echo "🌐 Nginx Configuration:"
if [ -f /etc/nginx/sites-available/wecare.techconnect.co.id ]; then
    echo "✅ Nginx config file exists"
    echo "Checking sm-admin location block:"
    grep -A 10 "location /sm-admin/" /etc/nginx/sites-available/wecare.techconnect.co.id || echo "❌ sm-admin location block not found"
else
    echo "❌ Nginx config file not found"
fi

# 10. Test external access
echo ""
echo "🌍 External Access Test:"
echo "Testing external URL..."
curl -f https://wecare.techconnect.co.id/sm-admin/api/health 2>/dev/null && echo "✅ External access working" || echo "❌ External access failed"

echo ""
echo "📋 Summary:"
echo "=========="
echo "If you see errors above:"
echo "1. ❌ .env missing -> Copy and configure .env file"
echo "2. ❌ node_modules missing -> Run 'npm ci'"
echo "3. ❌ .next missing -> Run 'npm run build'"
echo "4. ❌ PM2 not running -> Run 'pm2 start ecosystem.config.js'"
echo "5. ❌ Database connection failed -> Check database tunnel: gcloud compute ssh gcp-hr-applications -- -L 5488:localhost:5488"
echo "6. ❌ External access failed -> Check nginx configuration and restart nginx"
echo ""
echo "For more help, check logs:"
echo "- PM2 logs: pm2 logs sm-admin-wa-dashboard"
echo "- Nginx logs: sudo tail -f /var/log/nginx/error.log"