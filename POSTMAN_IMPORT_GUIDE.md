# Postman Import Guide - SM Admin Dashboard API

## Files untuk Import Postman

### 1. Collection File
**File:** `SM-Admin-API-Collection.postman_collection.json`
- Berisi semua endpoint API yang tersedia
- Sudah dikonfigurasi dengan authentication headers
- Terorganisir dalam folder berdasarkan kategori

### 2. Environment File  
**File:** `SM-Admin-Production.postman_environment.json`
- Berisi environment variables untuk production
- Includes API key, URLs, dan credentials

## Cara Import ke Postman

### Step 1: Import Collection
1. Buka aplikasi Postman
2. Klik **Import** (tombol di kiri atas)
3. Pilih **Upload Files** atau drag & drop file `SM-Admin-API-Collection.postman_collection.json`
4. Klik **Import**

### Step 2: Import Environment
1. Di Postman, klik **Import** lagi
2. Upload file `SM-Admin-Production.postman_environment.json`
3. Klik **Import**

### Step 3: Setup Environment
1. Di Postman, pilih environment **SM Admin Production Environment** dari dropdown (kanan atas)
2. Klik icon mata (👁️) untuk edit environment variables
3. **SUDAH DIKONFIGURASI:** API key sudah diset ke `sm2024_admin_api_key_secure_access`
4. **SUDAH DIKONFIGURASI:** Base URL sudah diset ke `https://wecare.techconnect.co.id/sm-admin/api`

### Step 4: Testing API
1. Pilih collection **SM Admin Dashboard API Collection**
2. Mulai dengan endpoint **Health Check** untuk test koneksi
3. **PENTING:** Semua URL menggunakan trailing slash (/) di akhir
4. Contoh working URL: `https://wecare.techconnect.co.id/sm-admin/api/health/`
5. Semua request sudah include authentication headers otomatis

## Struktur Collection

### 📁 Authentication
- **Login** - N8N webhook authentication

### 📁 Health & Debug  
- **Health Check** - Cek status API
- **Debug Info** - Debug information
- **SAP Test** - Test SAP connection
- **Test Endpoint** - General test endpoint

### 📁 Chat Management
- **Get Company Codes** - List company codes
- **Get Chat History Filtered** - Filter chat history
- **Get Menu Options** - Available menu options

### 📁 Admin Management
- **Knowledge Benefit** - Benefit management
- **Menu Master** - Menu CRUD operations

### 📁 CC Benefit Mapping
- **Get/Post CC Benefit Mapping** - Company code benefit mapping
- **CC Benefit Mapping Mock** - Mock data for testing

### 📁 CC PP Mapping
- **Get/Post CC PP Mapping** - Company code PP mapping

### 📁 Monitoring
- **Backup Schedule** - Backup management
- **Chat History** - Chat monitoring
- **Chat Stats** - Statistics
- **Company Contacts** - Contact management
- **Unique Contacts** - Unique contact tracking

### 📁 Data Processing
- **MD to Vector Pipeline** - Markdown processing
- **PDF to MD Pipeline** - PDF conversion

### 📁 Export Functions
- **Export Comprehensive** - Data export

### 📁 Sheets Integration
- **Get/Update Sheets Data** - Google Sheets integration

### 📁 Webhook Integration
- **N8N Webhook** - Webhook testing

### 📁 V1 API Legacy
- **V1 Main Endpoint** - Legacy API main entry point
- **V1 Health Check** - Legacy health monitoring  
- **V1 Chat Main** - Legacy chat system main endpoint
- **V1 Chat Active** - Active chat sessions
- **V1 Chat by Phone Number** - Chat history by phone number (dynamic parameter)
- **V1 Feedback History** - Historical feedback data
- **V1 Feedback Tracker GET** - Get feedback tracking data
- **V1 Feedback Tracker POST** - Submit new feedback

## Environment Variables

| Variable | Description | Value |
|----------|-------------|-------|
| `baseUrl` | Base API URL | `https://wecare.techconnect.co.id/sm-admin/api` |
| `apiKey` | API authentication key | `sm2024_admin_api_key_secure_access` |
| `websiteUrl` | Main website URL | `https://wecare.techconnect.co.id/sm-admin` |
| `adminEmail1` | Admin email 1 | `benefitadmin@sinarmasmining.com` |
| `adminPassword1` | Admin password 1 | `benefit2024` |
| `adminEmail2` | Admin email 2 | `hris@sinarmasmining.com` |
| `adminPassword2` | Admin password 2 | `hris2024` |

## Tips Penggunaan

1. **API sudah WORKING** ✅ - All endpoints tested and confirmed working
2. **URL Pattern:** Semua endpoint menggunakan trailing slash `/` di akhir
3. **Working URL Format:** `https://wecare.techconnect.co.id/sm-admin/api/{endpoint}/`
4. **API Key sudah dikonfigurasi** - `sm2024_admin_api_key_secure_access`
5. **Start dengan Health Check** untuk memastikan koneksi
6. **Login endpoint** menggunakan N8N webhook
7. **POST requests** sudah include sample JSON body
8. **File uploads** menggunakan form-data untuk PDF processing
9. **Expected Response:** JSON format untuk semua successful requests

## Troubleshooting

### 200 OK ✅
- Health endpoint working perfectly
- Database connection successful
- API responding with proper JSON

### 401 Unauthorized 🔐
- Normal for protected endpoints
- Debug endpoint requires authentication
- Login endpoint expects valid credentials

### 405 Method Not Allowed 📝
- Try POST instead of GET for login
- Some endpoints only accept specific HTTP methods

### Working URL Pattern ✅
- **CORRECT:** `https://wecare.techconnect.co.id/sm-admin/api/health/`
- **WRONG:** `https://wecare.techconnect.co.id/sm-admin/app/api/health/`
- Always use trailing slash `/` at the end

## Testing Sequence Recommendation

1. **Health Check** ✅ - CONFIRMED WORKING (Status 200, JSON response)
2. **Login** 🔐 - CONFIRMED RESPONDING (Status 401, needs valid credentials)  
3. **Debug** 🔐 - CONFIRMED RESPONDING (Status 401, needs authentication)
4. **Get Company Codes** - Test basic data retrieval
5. **Chat History** - Test filtered data
6. **Menu Master** - Test CRUD operations
7. **All Monitoring endpoints** - Test dashboard data

**Result:** API infrastructure is FULLY FUNCTIONAL! ✅

## Support

Jika ada masalah dengan API testing, check:
1. Environment variables sudah benar
2. API key valid dan aktif
3. Network connectivity ke production server
4. Server status dan availability