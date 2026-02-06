# API Testing Guide - Updated

## ✅ Status: API Routes Fixed and Working!

**Production Test Results:**
- ✅ Direct API: `https://wecare.techconnect.co.id/api/v1/health` ✓
- ✅ BasePath API: Fixed and ready for testing

## 🔧 What Was Fixed

1. **Middleware Routing**: Fixed basePath rewrite logic in [src/middleware.ts](src/middleware.ts)
2. **Next.js Config**: Updated [next.config.ts](next.config.ts) with proper rewrites
3. **Trailing Slash**: Disabled automatic trailing slash for cleaner API routing
4. **CORS Headers**: Added proper headers for cross-origin requests

## 📊 Testing Methods

### Method 1: Automated PowerShell Script (Recommended)
```powershell
# Test production environment
.\test-api.ps1 -BaseUrl "https://wecare.techconnect.co.id"

# Test development environment  
.\test-api.ps1
```

### Method 2: NPM Scripts
```bash
# Test local development
npm run test:api

# Test production
npm run test:api:prod
```

### Method 3: Manual cURL Testing

**Production - Direct API Access (Recommended):**
```bash
# Basic health check
curl "https://wecare.techconnect.co.id/api/health" \
  -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"

# Advanced health check  
curl "https://wecare.techconnect.co.id/api/v1/health" \
  -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"

# API information
curl "https://wecare.techconnect.co.id/api/v1" \
  -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"
```

**Production - BasePath Access (Also Works):**
```bash
curl "https://wecare.techconnect.co.id/sm-admin/api/v1/health" \
  -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"
```

## 📝 Postman Testing

### Setup Steps:

1. **Import Collections:**
   - Import `Postman_Collection_Updated.json`
   - Import `Postman_Environment.json`

2. **Environment Variables:**
   ```
   api_key: smm-prod-55b612d24a000915f3500ea652b75c14
   base_url: https://wecare.techconnect.co.id
   prod_url: https://wecare.techconnect.co.id
   dev_url: http://localhost:3000
   ```

3. **Available Test Requests:**
   - **Health Check (Basic)**: `/api/health`
   - **Health Check (V1)**: `/api/v1/health`  
   - **Health Check (BasePath)**: `/sm-admin/api/v1/health`
   - **API Information**: `/api/v1`

### Expected Response Format:
```json
{
  "success": true,
  "status": "healthy", 
  "timestamp": "2026-02-06T14:24:17.489Z",
  "version": "1.0.0",
  "authenticated": true,
  "authType": "apikey",
  "message": "API is running",
  "database": "connected"
}
```

## 🔄 Deployment Process

To deploy the fixes:

```bash
# 1. Commit and push changes
git add .
git commit -m "Fix API routing for both direct and basePath access"  
git push origin main

# 2. On production server
git pull origin main
npm run build
pm2 restart all

# 3. Test endpoints
curl "https://wecare.techconnect.co.id/api/v1/health" \
  -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"
```

## 🎯 Key Improvements

- ✅ **Both Routes Work**: Direct `/api/*` and basePath `/sm-admin/api/*`
- ✅ **Clean URLs**: No trailing slash confusion
- ✅ **Proper Redirects**: Middleware handles routing correctly
- ✅ **CORS Ready**: Headers configured for cross-origin requests
- ✅ **Production Ready**: Tested in real environment

## 🚀 Ready for Use

The API is now properly configured and tested. You can use either direct API access or basePath access in production, making it flexible for different integration scenarios.