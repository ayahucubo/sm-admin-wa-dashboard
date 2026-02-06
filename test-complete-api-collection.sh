#!/bin/bash

# Comprehensive API Test - All Endpoints Including V1 Legacy
BASE_URL="https://wecare.techconnect.co.id/sm-admin/api"
API_KEY="sm2024_admin_api_key_secure_access"

echo "========================================"
echo "🔍 COMPLETE API ENDPOINT TEST"
echo "Base URL: $BASE_URL"
echo "Testing ALL endpoints including V1 Legacy"
echo "========================================"

test_endpoint() {
  local endpoint="$1"
  local method="${2:-GET}"
  local data="$3"
  local description="$4"
  
  echo ""
  echo "🧪 Testing: $description"
  echo "   Method: $method"
  echo "   URL: $BASE_URL/$endpoint/"
  echo "   ----------------------------------------"
  
  if [ "$method" = "POST" ] && [ ! -z "$data" ]; then
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
      -X POST \
      -H "x-api-key: $API_KEY" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL/$endpoint/")
  else
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
      -X "$method" \
      -H "x-api-key: $API_KEY" \
      -H "Accept: application/json" \
      "$BASE_URL/$endpoint/")
  fi
  
  http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_CODE:/d')
  
  # Status interpretation
  if [[ $http_code =~ ^2 ]]; then
    echo "   ✅ SUCCESS ($http_code)"
  elif [[ $http_code == "401" ]]; then
    echo "   🔐 AUTH REQUIRED ($http_code) - Normal for protected endpoints"  
  elif [[ $http_code == "405" ]]; then
    echo "   📝 METHOD NOT ALLOWED ($http_code) - Try different HTTP method"
  elif [[ $http_code == "404" ]]; then
    echo "   ❌ NOT FOUND ($http_code) - Endpoint may not exist"
  else
    echo "   ⚠️  UNEXPECTED ($http_code)"
  fi
  
  # Show response preview
  if echo "$body" | grep -q "{"; then
    echo "   📄 Response: JSON"
    echo "   $(echo "$body" | cut -c1-150 | tr -d '\n')..."
  else
    echo "   📄 Response: $(echo "$body" | head -c50 | tr -d '\n')..."
  fi
}

echo ""
echo "🏥 === CORE SYSTEM ENDPOINTS ==="
test_endpoint "health" "GET" "" "Health Check"
test_endpoint "debug" "GET" "" "Debug Information"
test_endpoint "test" "GET" "" "Test Endpoint"

echo ""
echo "🔐 === AUTHENTICATION ==="
test_endpoint "login" "POST" '{"email": "benefitadmin@sinarmasmining.com", "password": "benefit2024"}' "N8N Login"

echo ""
echo "💬 === CHAT MANAGEMENT ==="
test_endpoint "chat/company-codes" "GET" "" "Company Codes"
test_endpoint "chat/history-filtered" "POST" '{"startDate": "2024-01-01", "endDate": "2024-12-31", "limit": 10}' "Chat History Filtered"
test_endpoint "chat/menu-options" "GET" "" "Menu Options"

echo ""
echo "🏢 === ADMIN MANAGEMENT ==="
test_endpoint "knowledge-benefit" "GET" "" "Knowledge Benefit"
test_endpoint "menu-master" "GET" "" "Menu Master - GET"
test_endpoint "menu-master" "POST" '{"menuName": "Test Menu", "menuDescription": "Test", "isActive": true}' "Menu Master - POST"

echo ""
echo "🔗 === MAPPING ENDPOINTS ==="
test_endpoint "cc-benefit-mapping" "GET" "" "CC Benefit Mapping - GET"
test_endpoint "cc-benefit-mapping" "POST" '{"companyCode": "SM001", "benefitType": "Medical", "mapping": "Active"}' "CC Benefit Mapping - POST"
test_endpoint "cc-benefit-mapping-mock" "GET" "" "CC Benefit Mapping Mock"
test_endpoint "cc-pp-mapping" "GET" "" "CC PP Mapping - GET"
test_endpoint "cc-pp-mapping" "POST" '{"companyCode": "SM001", "ppType": "Employee", "mapping": "Active"}' "CC PP Mapping - POST"

echo ""
echo "📊 === MONITORING ENDPOINTS ==="
test_endpoint "monitoring/backup-schedule" "GET" "" "Backup Schedule - GET"
test_endpoint "monitoring/backup-schedule" "POST" '{"schedule": "0 2 * * *", "type": "full", "enabled": true}' "Backup Schedule - POST"
test_endpoint "monitoring/backup-scheduler" "GET" "" "Backup Scheduler"
test_endpoint "monitoring/chat-history" "GET" "" "Monitor Chat History"
test_endpoint "monitoring/chat-stats" "GET" "" "Chat Statistics"
test_endpoint "monitoring/company-contacts" "GET" "" "Company Contacts"
test_endpoint "monitoring/unique-contacts" "GET" "" "Unique Contacts"
test_endpoint "monitoring/database-backup" "GET" "" "Database Backup"
test_endpoint "monitoring/database-storage" "GET" "" "Database Storage"
test_endpoint "monitoring/feedback-rating" "GET" "" "Feedback Rating"

echo ""
echo "🔄 === DATA PROCESSING ==="
test_endpoint "md-to-vector-pipeline" "GET" "" "MD to Vector Pipeline - GET"
test_endpoint "md-to-vector-pipeline" "POST" '{"markdownContent": "# Test\nSample content", "processType": "full"}' "MD to Vector Pipeline - POST"
test_endpoint "pdf-to-md-pipeline" "GET" "" "PDF to MD Pipeline - GET"

echo ""
echo "📤 === EXPORT & INTEGRATION ==="
test_endpoint "export/comprehensive" "POST" '{"startDate": "2024-01-01", "endDate": "2024-12-31", "exportType": "excel"}' "Export Comprehensive"
test_endpoint "sheets" "GET" "" "Sheets - GET"
test_endpoint "sheets" "POST" '{"sheetId": "test-sheet", "range": "A1:B2", "data": [["Header1", "Header2"]]}' "Sheets - POST"
test_endpoint "n8n-webhook" "POST" '{"action": "test_webhook", "data": {"message": "Test"}}' "N8N Webhook"

echo ""
echo "🔧 === V1 LEGACY API ENDPOINTS ==="
test_endpoint "v1" "GET" "" "V1 Main Endpoint"
test_endpoint "v1/health" "GET" "" "V1 Health Check"
test_endpoint "v1/chat" "GET" "" "V1 Chat Main"
test_endpoint "v1/chat/active" "GET" "" "V1 Chat Active"
test_endpoint "v1/chat/628123456789" "GET" "" "V1 Chat by Phone"
test_endpoint "v1/feedback/history" "GET" "" "V1 Feedback History"
test_endpoint "v1/feedback/tracker" "GET" "" "V1 Feedback Tracker - GET"
test_endpoint "v1/feedback/tracker" "POST" '{"phoneNumber": "628123456789", "rating": 5, "feedback": "Test feedback"}' "V1 Feedback Tracker - POST"

echo ""
echo "========================================"
echo "📋 COMPREHENSIVE TEST SUMMARY"
echo "========================================"
echo "✅ SUCCESS = Endpoint working properly"
echo "🔐 AUTH REQUIRED = Normal behavior for protected endpoints"
echo "📝 METHOD NOT ALLOWED = Try different HTTP method"
echo "❌ NOT FOUND = Endpoint doesn't exist or URL pattern wrong"
echo "⚠️  UNEXPECTED = Check server logs"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. ✅ Import updated Postman collection with V1 endpoints"
echo "2. ✅ All endpoints now use trailing slash pattern"
echo "3. ✅ API Key authentication configured"
echo "4. 🧪 Test specific endpoints that show SUCCESS status"
echo "5. 🔍 Investigate any unexpected failures"
echo ""
echo "📊 TOTAL ENDPOINTS TESTED: 35+"
echo "🔗 Collection includes all major API categories"
echo "🚀 Ready for comprehensive API testing!"
echo "========================================"