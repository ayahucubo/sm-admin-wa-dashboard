# 🚀 SM Admin API - Postman Testing Guide

## 📋 Base Configuration

**Base URL:** `https://wecare.techconnect.co.id/sm-admin/api`
**Authentication:** API Key Header
**Header:** `X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14`

## 🔧 Postman Environment Setup

### 1. Create New Environment
- Environment Name: `SM Admin Production`
- Variables:
  ```
  base_url: https://wecare.techconnect.co.id/sm-admin/api
  api_key: smm-prod-55b612d24a000915f3500ea652b75c14
  ```

### 2. Collection Headers
Set these headers for all requests in collection:
```
Content-Type: application/json
X-API-Key: {{api_key}}
```

## 🧪 API Endpoints to Test

### 1. Health Check
```
GET {{base_url}}/health
```
**Expected:** `{"status":"ok","timestamp":"...","environment":"production"}`

### 2. Login API (N8N Integration)
```
POST {{base_url}}/login
Content-Type: application/json

{
  "email": "benefitadmin@sinarmasmining.com",
  "password": "bnft_1209"
}
```
**Expected:** JWT token response or N8N authentication result

### 3. Alternative Login (HRIS Admin)
```
POST {{base_url}}/login
Content-Type: application/json

{
  "email": "hris@sinarmasmining.com", 
  "password": "HR15_Smm"
}
```

### 4. Menu Master
```
GET {{base_url}}/menu-master
X-API-Key: {{api_key}}
```

### 5. Knowledge Benefit
```
GET {{base_url}}/knowledge-benefit
X-API-Key: {{api_key}}
```

### 6. Chat Endpoints
```
GET {{base_url}}/chat/company-codes
GET {{base_url}}/chat/menu-options
GET {{base_url}}/chat/history-filtered?limit=10
```

### 7. Monitoring APIs
```
GET {{base_url}}/monitoring/chat-stats
GET {{base_url}}/monitoring/chat-history
GET {{base_url}}/monitoring/company-contacts
GET {{base_url}}/monitoring/database-storage
GET {{base_url}}/monitoring/feedback-rating
GET {{base_url}}/monitoring/unique-contacts
```

### 8. V1 APIs
```
GET {{base_url}}/v1/health
GET {{base_url}}/v1/chat?limit=5
GET {{base_url}}/v1/feedback/history
```

## 🔒 Authentication Examples

### API Key Authentication
```
Headers:
X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14
Content-Type: application/json
```

### JWT Token Authentication (after login)
```
Headers:
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

## 🛠️ Troubleshooting

### If Getting 308 Redirects:
1. **Add Trailing Slash to URL:**
   ```
   Change: {{base_url}}/health
   To: {{base_url}}/health/
   ```

2. **Disable Auto-Redirect in Postman:**
   - Settings → General → Automatically follow redirects: OFF

3. **Test Direct Endpoint:**
   ```
   GET https://wecare.techconnect.co.id/sm-admin/api/health/
   ```

### If Getting 404 Errors:
- Verify base URL is correct
- Check API key is included in headers
- Ensure Content-Type is set

### If Getting CORS Errors:
- Use Headers: `Origin: https://wecare.techconnect.co.id`

## 📊 Expected Response Codes

- **200:** Success with data
- **400:** Bad request (missing parameters) 
- **401:** Unauthorized (invalid API key)
- **404:** Endpoint not found
- **500:** Server error

## 🎯 Quick Test Sequence

1. **Health Check:** `GET /health` or `GET /health/`
2. **Login Test:** `POST /login` with admin credentials  
3. **Menu Data:** `GET /menu-master`
4. **Chat APIs:** `GET /chat/company-codes`
5. **Monitoring:** `GET /monitoring/chat-stats`

## 🚨 Important Notes

- **Always include API Key header** for authenticated endpoints
- **Use trailing slash** if getting 308 redirects
- **N8N Login** may take 5-10 seconds to respond
- **Monitor rate limits** if testing extensively

## 📲 Postman Collection Import

You can create this collection in Postman with the above endpoints, or export/import a collection file once configured.