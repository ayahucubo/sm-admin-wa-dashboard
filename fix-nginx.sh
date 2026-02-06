#!/bin/bash

echo "🔧 Fixing Nginx Configuration for SM Admin API"

# Create fixed nginx configuration
sudo tee /etc/nginx/sites-available/wecare.techconnect.co.id > /dev/null <<'EOF'
server {
    listen 80;
    server_name wecare.techconnect.co.id localhost;

    client_max_body_size 100M;

    # SM Admin WA Dashboard - PRIORITY ROUTES (specific paths first)
    location ^~ /sm-admin/api/ {
        proxy_pass http://localhost:3001/api/;
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
        proxy_read_timeout 300;
        proxy_connect_timeout 75;
    }

    # SM Admin WA Dashboard - Frontend
    location /sm-admin/ {
        proxy_pass http://localhost:3001/;
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

    # Global ID Management System API - More specific first
    location ^~ /api/v1/data/pegawai {
        deny all;
        return 403;
    }

    # Global ID Management System API
    location ^~ /api/ {
        proxy_pass http://localhost:8001/api/;
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

    # Global ID Management System Frontend
    location /gid/ {
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

    # Genai Admin
    location /genai-admin/ {
        rewrite ^/genai-admin(/.*)$ $1 break;
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Mining Industry HR Position Qualification Assessment - HRAI API
    location ^~ /mining-hr/api/ {
        proxy_pass http://127.0.0.1:3050/api/;
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
        proxy_read_timeout 300;
        proxy_connect_timeout 75;
        client_max_body_size 100M;
    }

    # Mining Industry HR Position Qualification Assessment - HRAI Frontend
    location /mining-hr/ {
        alias /var/www/Ai_Position_Skill/build/;
        try_files $uri $uri/ /mining-hr/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location ~* \.(html|json)$ {
            expires 1d;
            add_header Cache-Control "public";
        }
    }

    # Handle root redirects
    location = /mining-hr {
        return 301 /mining-hr/;
    }

    location = /gid {
        return 301 /gid/;
    }

    # Webhook endpoints
    location /webhook-test/ {
        proxy_pass http://localhost:5688/webhook-test/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhook/ {
        proxy_pass http://localhost:5688/webhook/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        access_log /var/log/nginx/webhook_access.log;
        error_log /var/log/nginx/webhook_error.log;

        allow 35.191.51.0/24;
        allow 35.191.58.0/24;
    }

    # Default N8N (LAST - catch all)
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

echo "✅ Nginx configuration updated!"
echo "🔄 Testing configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration valid!"
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded!"
    
    echo ""
    echo "🧪 Testing endpoints after nginx fix..."
    sleep 2
    
    echo ""
    echo "Testing SM Admin API via basePath..."
    curl -s "https://wecare.techconnect.co.id/sm-admin/api/v1/health" -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14" | head -c 200
    
    echo ""
    echo ""
    echo "Testing SM Admin API info..."
    curl -s "https://wecare.techconnect.co.id/sm-admin/api/v1" -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14" | head -c 200
    
else
    echo "❌ Configuration has errors! Please check manually."
    exit 1
fi