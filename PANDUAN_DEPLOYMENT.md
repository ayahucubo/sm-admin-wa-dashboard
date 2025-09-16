# Panduan Deployment SM Admin WA Dashboard

## 📋 Daftar Isi
1. [Persiapan Deployment](#persiapan-deployment)
2. [Deployment Awal](#deployment-awal)
3. [Update Website](#update-website)
4. [Troubleshooting](#troubleshooting)
5. [Monitoring](#monitoring)

---

## 🚀 Persiapan Deployment

### 1. Persyaratan Sistem
- **Server OS**: Ubuntu 20.04+ atau CentOS 7+
- **Node.js**: v20.19.5 atau lebih baru
- **PM2**: Process Manager untuk Node.js
- **Nginx**: Reverse proxy server
- **PostgreSQL**: Database (Docker atau native)
- **Git**: Version control

### 2. Struktur Direktori Server
```
/var/www/
├── sm-admin-wa-dashboard/     # Aplikasi Next.js
├── nginx/                     # Konfigurasi Nginx
└── logs/                      # Log files
```

### 3. Environment Variables
Pastikan file `.env.production` sudah dikonfigurasi:
```bash
NODE_ENV=production
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5488
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=n8nuser
DB_POSTGRESDB_PASSWORD=P0stgres99
```

### 4. Database Setup
Pastikan tabel-tabel berikut sudah ada:
- `n8n_param_cc_benefit_mapping`
- `n8n_param_cc_pp_mapping`
- `n8n_param_menu_master`

---

## 🎯 Deployment Awal

### Langkah 1: Persiapan Server
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js (menggunakan NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 global
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Buat direktori aplikasi
sudo mkdir -p /var/www/sm-admin-wa-dashboard
sudo chown $USER:$USER /var/www/sm-admin-wa-dashboard
```

### Langkah 2: Clone Repository
```bash
cd /var/www
git clone https://github.com/ayahucubo/sm-admin-wa-dashboard.git
cd sm-admin-wa-dashboard

# Install dependencies
npm install

# Copy environment file
cp .env.local .env.production
# Edit .env.production sesuai konfigurasi production
nano .env.production
```

### Langkah 3: Build Aplikasi
```bash
# Build aplikasi Next.js
npm run build

# Test aplikasi berjalan
npm start
# Ctrl+C untuk stop
```

### Langkah 4: Konfigurasi PM2
```bash
# Buat file ecosystem
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sm-admin-wa-dashboard',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/sm-admin-wa-dashboard',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/logs/sm-admin-err.log',
    out_file: '/var/www/logs/sm-admin-out.log',
    log_file: '/var/www/logs/sm-admin-combined.log',
    time: true
  }]
};
EOF

# Buat direktori log
sudo mkdir -p /var/www/logs
sudo chown $USER:$USER /var/www/logs

# Start aplikasi dengan PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Langkah 5: Konfigurasi Nginx
```bash
# Buat konfigurasi Nginx
sudo cat > /etc/nginx/sites-available/sm-admin-wa-dashboard << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # Ganti dengan domain Anda
    
    # Redirect root to /sm-admin/
    location = / {
        return 301 /sm-admin/;
    }
    
    # Main application
    location /sm-admin/ {
        proxy_pass http://localhost:3000/sm-admin/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files
    location /sm-admin/_next/static/ {
        proxy_pass http://localhost:3000/sm-admin/_next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Aktifkan site
sudo ln -s /etc/nginx/sites-available/sm-admin-wa-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Langkah 6: Konfigurasi PostgreSQL (Docker)
```bash
# Jika menggunakan Docker PostgreSQL
docker run -d \
  --name postgres-n8n \
  -e POSTGRES_DB=postgres \
  -e POSTGRES_USER=n8nuser \
  -e POSTGRES_PASSWORD=P0stgres99 \
  -p 5488:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:13

# Verifikasi koneksi
docker logs postgres-n8n
```

---

## 🔄 Update Website

### Langkah 1: Backup
```bash
# Backup database (jika perlu)
pg_dump -h localhost -p 5488 -U n8nuser -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup aplikasi saat ini
cd /var/www
cp -r sm-admin-wa-dashboard sm-admin-wa-dashboard_backup_$(date +%Y%m%d_%H%M%S)
```

### Langkah 2: Pull Perubahan
```bash
cd /var/www/sm-admin-wa-dashboard

# Stop aplikasi
pm2 stop sm-admin-wa-dashboard

# Pull perubahan terbaru
git fetch origin
git pull origin main

# Install dependencies baru (jika ada)
npm install

# Update environment jika diperlukan
nano .env.production
```

### Langkah 3: Build Ulang
```bash
# Build aplikasi dengan perubahan terbaru
npm run build

# Verifikasi build berhasil
echo "Build completed at $(date)"
```

### Langkah 4: Restart Aplikasi
```bash
# Restart aplikasi
pm2 restart sm-admin-wa-dashboard

# Verifikasi status
pm2 status
pm2 logs sm-admin-wa-dashboard --lines 50
```

### Langkah 5: Verifikasi Deployment
```bash
# Test endpoint health
curl -I http://localhost:3000/sm-admin/api/health

# Test halaman utama
curl -I http://localhost/sm-admin/

# Monitor logs
pm2 logs sm-admin-wa-dashboard --follow
```

---

## ⚠️ Troubleshooting

### Masalah Umum dan Solusi

#### 1. Aplikasi Tidak Bisa Diakses
```bash
# Cek status PM2
pm2 status

# Cek log error
pm2 logs sm-admin-wa-dashboard --err

# Restart jika perlu
pm2 restart sm-admin-wa-dashboard
```

#### 2. Error Database Connection
```bash
# Test koneksi database
psql -h localhost -p 5488 -U n8nuser -d postgres -c "SELECT version();"

# Cek container Docker (jika menggunakan Docker)
docker ps | grep postgres
docker logs postgres-n8n

# Restart database jika perlu
docker restart postgres-n8n
```

#### 3. Nginx 502 Bad Gateway
```bash
# Cek konfigurasi Nginx
sudo nginx -t

# Cek log Nginx
sudo tail -f /var/log/nginx/error.log

# Cek apakah aplikasi berjalan di port 3000
netstat -tlnp | grep 3000

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. Error Build/Compilation
```bash
# Hapus node_modules dan install ulang
rm -rf node_modules package-lock.json
npm install

# Hapus cache Next.js
rm -rf .next

# Build ulang
npm run build
```

#### 5. Memory Issues
```bash
# Cek penggunaan memory
free -h
pm2 monit

# Restart aplikasi jika memory tinggi
pm2 restart sm-admin-wa-dashboard

# Sesuaikan memory limit di ecosystem.config.js
nano ecosystem.config.js
# Ubah max_memory_restart: '2G'
```

---

## 📊 Monitoring

### 1. Monitoring PM2
```bash
# Status aplikasi
pm2 status

# Monitor real-time
pm2 monit

# Log aplikasi
pm2 logs sm-admin-wa-dashboard

# Restart otomatis jika crash
pm2 resurrect
```

### 2. Monitoring Nginx
```bash
# Status Nginx
sudo systemctl status nginx

# Log access
sudo tail -f /var/log/nginx/access.log

# Log error
sudo tail -f /var/log/nginx/error.log
```

### 3. Monitoring Database
```bash
# Cek koneksi database
psql -h localhost -p 5488 -U n8nuser -d postgres -c "SELECT COUNT(*) FROM n8n_param_menu_master;"

# Monitor Docker container
docker stats postgres-n8n

# Log database
docker logs postgres-n8n --tail 100
```

### 4. Health Check Script
```bash
# Buat script monitoring
cat > /var/www/health_check.sh << 'EOF'
#!/bin/bash
echo "=== Health Check $(date) ==="

# Cek PM2
echo "PM2 Status:"
pm2 jlist | jq '.[0].pm2_env.status'

# Cek Nginx
echo "Nginx Status:"
sudo systemctl is-active nginx

# Cek Database
echo "Database Status:"
psql -h localhost -p 5488 -U n8nuser -d postgres -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Database: OK"
else
    echo "Database: ERROR"
fi

# Cek endpoint
echo "API Health:"
curl -s http://localhost:3000/sm-admin/api/health | jq '.status'

echo "=== End Health Check ==="
EOF

chmod +x /var/www/health_check.sh

# Jalankan health check
/var/www/health_check.sh
```

### 5. Automated Updates (Opsional)
```bash
# Buat script auto-update
cat > /var/www/auto_update.sh << 'EOF'
#!/bin/bash
cd /var/www/sm-admin-wa-dashboard

echo "Checking for updates..."
git fetch origin

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ $LOCAL != $REMOTE ]; then
    echo "Updates found. Deploying..."
    
    # Backup current version
    cp -r /var/www/sm-admin-wa-dashboard /var/www/backup_$(date +%Y%m%d_%H%M%S)
    
    # Pull updates
    git pull origin main
    npm install
    npm run build
    
    # Restart
    pm2 restart sm-admin-wa-dashboard
    
    echo "Update completed!"
else
    echo "No updates available."
fi
EOF

chmod +x /var/www/auto_update.sh

# Setup cron job (opsional - update otomatis setiap jam)
# crontab -e
# 0 * * * * /var/www/auto_update.sh >> /var/www/logs/auto_update.log 2>&1
```

---

## 📝 Catatan Penting

### Keamanan
- Selalu gunakan HTTPS di production
- Update password database secara berkala
- Backup database secara rutin
- Monitor log untuk aktivitas mencurigakan

### Performance
- Monitor penggunaan CPU dan memory
- Optimasi query database jika diperlukan
- Gunakan CDN untuk static assets
- Enable gzip compression di Nginx

### Backup Strategy
- Backup database harian
- Backup code sebelum update
- Simpan backup di lokasi terpisah
- Test restore procedure secara berkala

---

## 🆘 Kontak Support
Jika mengalami masalah yang tidak dapat diselesaikan:
1. Cek log error di PM2 dan Nginx
2. Dokumentasikan error message
3. Sertakan langkah-langkah yang sudah dicoba
4. Hubungi tim development dengan informasi lengkap

---

*Panduan ini dibuat untuk memastikan deployment yang stabil dan dapat diandalkan untuk SM Admin WA Dashboard.*