#!/bin/bash

echo "🧪 SM Admin API - Complete Endpoint Testing"
echo "=========================================="

BASE_URL="https://wecare.techconnect.co.id/sm-admin/api"
API_KEY="smm-prod-55b612d24a000915f3500ea652b75c14"

echo "🔑 Testing with API Key: $API_KEY"
echo "🌐 Base URL: $BASE_URL"
echo ""

# Test function
test_endpoint() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="${3:-}"
    
    echo "Testing: $method $endpoint"
    
    if [ "$method" = "POST" ]; then
        if [ -n "$data" ]; then
            result=$(curl -s -w "%{http_code}" -X POST "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "X-API-Key: $API_KEY" \
                -d "$data" \
                -o /tmp/test_result.txt)
        else
            result=$(curl -s -w "%{http_code}" -X POST "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "X-API-Key: $API_KEY" \
                -o /tmp/test_result.txt)
        fi
    else
        result=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint" \
            -H "X-API-Key: $API_KEY" \
            -o /tmp/test_result.txt)
    fi
    
    echo "  Result: HTTP $result"
    
    if [ -f /tmp/test_result.txt ]; then
        content=$(cat /tmp/test_result.txt | head -3 | tr '\n' ' ')
        echo "  Response: $content..."
    fi
    
    # Check if successful
    if [[ "$result" == "200" || "$result" == "201" ]]; then
        echo "  ✅ SUCCESS"
    elif [[ "$result" == "400" || "$result" == "401" ]]; then
        echo "  ⚠️  EXPECTED ERROR (endpoint working)"
    elif [[ "$result" == "308" || "$result" == "301" ]]; then
        echo "  🔄 REDIRECT (try with trailing slash)"
        # Test with trailing slash
        if [[ "$endpoint" != */ ]]; then
            echo "  Retesting with trailing slash..."
            test_endpoint "$endpoint/"
            return
        fi
    else
        echo "  ❌ ISSUE"
    fi
    
    echo ""
}

echo "1️⃣ CORE ENDPOINTS"
echo "=================="
test_endpoint "/health"
test_endpoint "/health/"

echo "2️⃣ AUTHENTICATION"
echo "=================="
test_endpoint "/login" "POST" '{"email":"test@example.com","password":"test"}'
test_endpoint "/login/" "POST" '{"email":"benefitadmin@sinarmasmining.com","password":"bnft_1209"}'

echo "3️⃣ MENU & DATA APIs"
echo "==================="
test_endpoint "/menu-master"
test_endpoint "/menu-master/"
test_endpoint "/knowledge-benefit"
test_endpoint "/knowledge-benefit/"

echo "4️⃣ CHAT APIs"
echo "============"
test_endpoint "/chat/company-codes"
test_endpoint "/chat/company-codes/"
test_endpoint "/chat/menu-options"
test_endpoint "/chat/menu-options/"
test_endpoint "/chat/history-filtered?limit=5"

echo "5️⃣ MONITORING APIs"
echo "=================="
test_endpoint "/monitoring/chat-stats"
test_endpoint "/monitoring/chat-stats/"
test_endpoint "/monitoring/chat-history"
test_endpoint "/monitoring/company-contacts"
test_endpoint "/monitoring/database-storage"
test_endpoint "/monitoring/feedback-rating"

echo "6️⃣ V1 APIs"
echo "=========="
test_endpoint "/v1/health"
test_endpoint "/v1/health/"
test_endpoint "/v1/chat?limit=3"
test_endpoint "/v1/feedback/history"

echo "7️⃣ DIAGNOSTIC"
echo "============="
test_endpoint "/diagnostic"
test_endpoint "/debug"

echo ""
echo "📊 SUMMARY FOR POSTMAN USAGE"
echo "============================"
echo "✅ Endpoints returning 200: Ready for Postman"
echo "⚠️  Endpoints returning 400/401: Working but need valid data/auth"
echo "🔄 Endpoints returning 308: Use trailing slash in Postman"
echo "❌ Endpoints returning 404/500: Need investigation"
echo ""
echo "🔑 USE THIS IN POSTMAN:"
echo "Base URL: $BASE_URL"
echo "Header: X-API-Key: $API_KEY"
echo "Content-Type: application/json"
echo ""
echo "💡 TIP: If getting 308 redirects in Postman, add '/' at end of URL"
echo "Example: /health → /health/"
echo ""
echo "🏁 Testing completed!"