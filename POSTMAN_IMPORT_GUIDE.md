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
3. **PENTING:** Ganti `your-production-api-key-here` dengan API key yang sebenarnya

### Step 4: Testing API
1. Pilih collection **SM Admin Dashboard API Collection**
2. Mulai dengan endpoint **Health Check** untuk test koneksi
3. Semua request sudah include authentication headers otomatis

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
- **V1 Main Endpoint** - Legacy API endpoint

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | Base API URL | `https://wecare.techconnect.co.id/sm-admin/app/api` |
| `apiKey` | API authentication key | `your-actual-api-key` |
| `websiteUrl` | Main website URL | `https://wecare.techconnect.co.id/sm-admin` |
| `adminEmail1` | Admin email 1 | `benefitadmin@sinarmasmining.com` |
| `adminPassword1` | Admin password 1 | `benefit2024` |
| `adminEmail2` | Admin email 2 | `hris@sinarmasmining.com` |
| `adminPassword2` | Admin password 2 | `hris2024` |

## Tips Penggunaan

1. **Selalu check environment** sebelum testing
2. **Start dengan Health Check** untuk memastikan koneksi
3. **API Key wajib** untuk semua requests
4. **Login endpoint** menggunakan N8N webhook
5. **POST requests** sudah include sample JSON body
6. **File uploads** menggunakan form-data untuk PDF processing

## Troubleshooting

### 401 Unauthorized
- Check API key di environment variables
- Pastikan API key sudah benar

### 404 Not Found  
- Verify base URL di environment
- Check apakah endpoint path sudah benar

### 308 Redirects
- Periksa trailing slash di URL
- Gunakan exact URL tanpa slash di akhir

## Testing Sequence Recommendation

1. **Health Check** - Verify API connection
2. **Login** - Test authentication  
3. **Get Company Codes** - Test basic data retrieval
4. **Chat History** - Test filtered data
5. **Menu Master** - Test CRUD operations
6. **Monitoring endpoints** - Test dashboard data

## Support

Jika ada masalah dengan API testing, check:
1. Environment variables sudah benar
2. API key valid dan aktif
3. Network connectivity ke production server
4. Server status dan availability