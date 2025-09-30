# Production Deployment Troubleshooting Guide

## Current Issue: Failed to Load Data

### Symptoms
- "Failed to Load Data"
- "Failed to fetch chat statistics" 
- "Error loading chat history"
- "Failed to fetch chat history"

### Root Cause Analysis

The issue is likely caused by one or more of the following:

1. **Database Connection Issues**
   - Port forwarding not active
   - Wrong database credentials
   - PostgreSQL not running in Docker
   - Network connectivity issues

2. **Environment Configuration Issues**
   - Missing or incorrect .env.production file
   - Wrong database names or ports
   - SSL configuration issues

3. **API Authentication Issues**
   - JWT token not being sent correctly
   - Production authentication failing

## Step-by-Step Fix

### Step 1: Verify Port Forwarding
```bash
# On your local machine, ensure this is running:
gcloud compute ssh gcp-hr-applications -- -L 5488:localhost:5488

# Keep this terminal open while deploying
```

### Step 2: Test Database Connection
```bash
# Run the database connection test
node test-production-db.js
```

Expected output:
```
✅ Primary Database connected successfully
✅ N8N Database connected successfully
🎉 All database connections successful!
```

### Step 3: Verify Docker Services on Server
```bash
# SSH to your server
gcloud compute ssh gcp-hr-applications

# Check if PostgreSQL is running
sudo docker ps | grep postgres

# Check if both databases exist
sudo docker exec -it [postgres-container-name] psql -U n8nuser -l

# You should see both 'postgres' and 'n8ndb' databases
```

### Step 4: Fix Environment Configuration

Your .env.production should look like this:
```env
PORT=3001
NODE_ENV=production
DB_TYPE=postgresdb

# Primary Database (postgres) - Custom tables
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5488
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=n8nuser
DB_POSTGRESDB_PASSWORD=P0stgres99

# Alternative format
DB_HOST=localhost
DB_PORT=5488
DB_NAME=postgres
DB_USER=n8nuser
DB_PASSWORD=P0stgres99

# N8N Core Database (n8ndb) - Execution data
DB_N8N_HOST=localhost
DB_N8N_PORT=5488
DB_N8N_DATABASE=n8ndb
DB_N8N_USER=n8nuser
DB_N8N_PASSWORD=P0stgres99

# Production settings
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=2000
DB_IDLE_TIMEOUT=30000
DB_SSL=false
```

### Step 5: Deploy Using the Script
```bash
# Make script executable
chmod +x deploy-production.sh

# Run deployment
./deploy-production.sh

# Or use PowerShell version
./deploy-production.ps1
```

### Step 6: Manual Deployment (if script fails)
```bash
# Install dependencies
npm ci --only=production

# Build the application
npm run build

# Test database connection
node test-production-db.js

# Start production server
NODE_ENV=production npm start
```

## Common Issues and Solutions

### Issue 1: "connection refused" Error
**Solution**: Check port forwarding
```bash
# Verify port forwarding is active
netstat -an | grep 5488
# Should show: tcp 127.0.0.1:5488 LISTEN
```

### Issue 2: "database does not exist" Error
**Solution**: Check database names
```bash
# Connect to PostgreSQL and list databases
docker exec -it [container] psql -U n8nuser -l
```

### Issue 3: "authentication failed" Error
**Solution**: Check credentials
```bash
# Test manual connection
docker exec -it [container] psql -U n8nuser -d postgres
docker exec -it [container] psql -U n8nuser -d n8ndb
```

### Issue 4: API calls failing
**Solution**: Check server logs
```bash
# Watch server logs for errors
tail -f /var/www/sm-admin-wa-new/.next/server.log
```

## Production Checklist

- [ ] Port forwarding active: `gcloud compute ssh gcp-hr-applications -- -L 5488:localhost:5488`
- [ ] .env.production file exists and configured correctly
- [ ] PostgreSQL Docker container running on server
- [ ] Both databases (postgres, n8ndb) exist and accessible
- [ ] Database connection test passes
- [ ] Application builds successfully
- [ ] Server starts on port 3001
- [ ] Admin dashboard loads without errors

## Quick Commands Reference

```bash
# Test database connection
node test-production-db.js

# Deploy to production
./deploy-production.sh

# Check running processes
ps aux | grep node

# Check port usage
lsof -i :3001

# View server logs
journalctl -u sm-admin-wa-dashboard -f
```

## Contact Information
If issues persist, check:
1. Server logs: `/var/www/sm-admin-wa-new/logs/`
2. Docker logs: `docker logs [container-name]`
3. Network connectivity: `telnet localhost 5488`