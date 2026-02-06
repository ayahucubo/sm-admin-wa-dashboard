# Quick API Testing Guide

## 🚨 Issues Found from Postman Testing:

1. **`/api/health`** → 404 (should work, needs investigation)
2. **`/api/v1/health`** → ✅ **WORKING!**  
3. **`/api/v1`** → Authentication error (API key tidak terbaca)
4. **Chat endpoints** → 404 (routing issue dengan trailing slash)

## 🔧 Quick Fixes Applied:

### 1. Fixed Postman Collection URLs
- Removed trailing slashes dari chat endpoints
- Updated variable references untuk cleaner URLs
- Created separate environment untuk testing

### 2. Environment Variables Fix
**Use:** `Postman_Environment_Fixed.json`
```json
{
  "direct_api_base": "https://wecare.techconnect.co.id",
  "basepath_api_base": "https://wecare.techconnect.co.id/sm-admin", 
  "api_key": "smm-prod-55b612d24a000915f3500ea652b75c14"
}
```

## 📝 Testing Steps (Updated):

### Step 1: Direct API Tests (Recommended)
```bash
# Test basic health  
curl "https://wecare.techconnect.co.id/api/health" \
  -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"

# Test v1 health (already working)
curl "https://wecare.techconnect.co.id/api/v1/health" \
  -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"

# Test v1 info with API key
curl "https://wecare.techconnect.co.id/api/v1" \
  -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"

# Test chat endpoints
curl "https://wecare.techconnect.co.id/api/v1/chat?limit=5" \
  -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"

curl "https://wecare.techconnect.co.id/api/v1/chat/active?limit=5" \
  -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"
```

### Step 2: Postman Setup 
1. **Import:** `Postman_Environment_Fixed.json` 
2. **Set Environment:** "SM Admin API - Fixed URLs"
3. **Update Collection URLs:**
   - Basic Health: `{{direct_api_base}}/api/health`
   - V1 Health: `{{direct_api_base}}/api/v1/health`  
   - V1 Info: `{{direct_api_base}}/api/v1`
   - Chat: `{{direct_api_base}}/api/v1/chat`
   - Chat Active: `{{direct_api_base}}/api/v1/chat/active`

### Step 3: Expected Results
**All should return JSON:**
```json
{
  "success": true,
  "status": "healthy", 
  "timestamp": "2026-02-06T...",
  "database": "connected"
}
```

## 🎯 Next Actions:

1. **Test dengan cURL** commands di atas dulu
2. **Update server** jika perlu: `git pull && npm run build && pm2 restart all`
3. **Import Postman environment baru** dan test lagi
4. **Report results** mana yang masih error

## 📱 Quick Terminal Test:
```bash
# Run this on your local machine to test production API
curl -v "https://wecare.techconnect.co.id/api/v1/health" -H "X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"
```

Should return JSON, not HTML 404!