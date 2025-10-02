#!/bin/bash

echo "🔧 FIXING NGINX CONFIGURATION"
echo "============================="

echo "1️⃣ Backing up current nginx config..."
sudo cp /etc/nginx/sites-available/wecare.techconnect.co.id /etc/nginx/sites-available/wecare.techconnect.co.id.backup.$(date +%Y%m%d-%H%M%S)

echo "2️⃣ Creating corrected nginx configuration..."
sudo tee /etc/nginx/sites-available/wecare.techconnect.co.id > /dev/null << 'EOF'
server {
    listen 80;
    server_name wecare.techconnect.co.id;

    client_max_body_size 100M;

    # Izinkan akses ke semua path n8n
    location / {
        proxy_pass http://localhost:5688;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Konfigurasi WebSocket
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
        # SM Admin WA Dashboard - TAMBAHKAN INI
        location /sm-admin/ {
                 proxy_pass http://localhost:3001/sm-admin/;  # Add /sm-admin/ >
                proxy_http_version 1.1;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_cache_bypass $http_upgrade;
                proxy_redirect off;
                proxy_buffering off;
        }
    # Izinkan ke genai admin
    location /genai-admin/ {
        rewrite ^/genai-admin(/.*)$ $1 break;

        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
    # Global ID Management System
    location /gid/ {
    # Remove /gid from the path before sending to backend
    rewrite ^/gid(/.*)$ $1 break;

    proxy_pass http://localhost:8001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
    proxy_redirect off;
    proxy_buffering off;
    client_max_body_size 100M;
}

# Handle root /gid redirect
location = /gid {
    return 301 /gid/;
}
    # Izinkan akses ke webhook-test
    location /webhook-test/ {
        proxy_pass http://localhost:5688/webhook-test/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Izinkan akses ke webhook
    location /webhook/ {
    proxy_pass http://localhost:5688/webhook/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Basic Authentication
    # auth_basic "Restricted Access";
    # auth_basic_user_file /etc/nginx/.htpasswd;

    # Logging IP
    access_log /var/log/nginx/webhook_access.log;
    error_log /var/log/nginx/webhook_error.log;

    # IP Whitelisting
    allow 35.191.51.0/24;   # Ganti dengan IP server WA untuk production
    allow 35.191.58.0/24;
    # deny all;
    }
}
EOF

echo "3️⃣ Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo "4️⃣ Reloading nginx..."
    sudo systemctl reload nginx
    
    echo "5️⃣ Testing the fix..."
    sleep 2
    echo "Testing external access:"
    curl -s -I https://wecare.techconnect.co.id/sm-admin/admin/ | head -3
    
    echo ""
    echo "✅ NGINX CONFIGURATION FIXED!"
    echo "Your website should now work at:"
    echo "🌐 https://wecare.techconnect.co.id/sm-admin/"
    echo "🌐 https://wecare.techconnect.co.id/sm-admin/admin/"
else
    echo "❌ Nginx configuration has errors. Restoring backup..."
    sudo cp /etc/nginx/sites-available/wecare.techconnect.co.id.backup /etc/nginx/sites-available/wecare.techconnect.co.id
    echo "Backup restored. Please check the configuration manually."
fi