# Server Deployment Guide

This guide explains how to properly configure and deploy the SM Admin WA Dashboard application on your server.

## Current Issues Identified

1. **Path Mismatch**: Server expects `/sm-admin/` but the app was configured for `/genai-admin/`
2. **Missing Environment Configuration**: No `.env` files for environment-specific settings
3. **Database Configuration**: Hardcoded values that won't work in production

## Issues Fixed

✅ **Updated Next.js Configuration**: Changed `basePath` from `/genai-admin` to `/sm-admin` to match your server setup
✅ **Created Environment Files**: Added `.env.local`, `.env.production`, and `.env.example`
✅ **Enhanced Database Configuration**: Added environment-specific database configuration with SSL support for production
✅ **Added Health Check Endpoint**: Created `/api/health` to verify database connectivity

## Server Setup Instructions

### 1. Environment Configuration

Copy the production environment file and configure it with your actual database credentials:

```bash
cp .env.example .env.production
```

Edit `.env.production` with your actual production database values:

```env
# Production Environment Variables
DB_HOST=your_actual_db_host
DB_PORT=5432
DB_NAME=your_actual_db_name
DB_USER=your_actual_db_user
DB_PASSWORD=your_actual_db_password
NODE_ENV=production
```

### 2. Build and Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start the production server
npm start
```

### 3. Server Configuration

Your server should be configured to:
- Serve the application at `/sm-admin/` path
- Proxy requests to `http://localhost:3001/sm-admin/`
- Handle static assets correctly

Example Nginx configuration:
```nginx
location /sm-admin/ {
    proxy_pass http://localhost:3001/sm-admin/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### 4. Database Setup

Ensure your PostgreSQL database is running and accessible. The application expects:
- A PostgreSQL database with the table `n8n_mapping_sme_cb_cc_benefit`
- Proper user permissions for CRUD operations
- Network access from the application server

### 5. Health Check

After deployment, verify the setup:

```bash
# Check application health
curl -I http://localhost:3001/sm-admin/

# Check database connectivity
curl http://localhost:3001/sm-admin/api/health
```

Expected responses:
- Application should return `200 OK` instead of `404 Not Found`
- Health check should return database connection status

## Troubleshooting

### Common Issues:

1. **404 Error**: 
   - Verify the server is running on the correct port (3001)
   - Check that the basePath configuration matches your server setup
   - Ensure the build was successful

2. **Database Connection Issues**:
   - Verify database credentials in `.env.production`
   - Check network connectivity between app and database
   - Use the health check endpoint to diagnose issues

3. **Static Assets Not Loading**:
   - Ensure `assetPrefix` is correctly configured
   - Check server configuration for static file serving

### Debug Commands:

```bash
# Check if the application is running
ps aux | grep node

# Check port usage
netstat -tlnp | grep 3001

# Check application logs
journalctl -u your-app-service -f

# Test database connection from server
psql -h DB_HOST -p DB_PORT -U DB_USER -d DB_NAME
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.production` to version control
2. **Database Security**: Use strong passwords and proper network restrictions
3. **SSL**: Consider enabling SSL/TLS for production deployments
4. **Firewall**: Restrict database access to only the application server

## Next Steps

1. Update your production environment variables with actual values
2. Rebuild the application with the new configuration
3. Test the health check endpoint
4. Verify all features work correctly in production

## Support

If you encounter issues:
1. Check the health check endpoint: `/api/health`
2. Review application logs
3. Verify environment configuration
4. Test database connectivity independently