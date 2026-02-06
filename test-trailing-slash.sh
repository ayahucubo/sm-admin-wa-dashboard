#!/bin/bash

# Test API with Trailing Slash (the redirected URLs)
BASE_URL="https://wecare.techconnect.co.id"
API_KEY="sm2024_admin_api_key_secure_access"

echo "========================================"
echo "TESTING API WITH TRAILING SLASH"
echo "Testing the redirected URLs..."
echo "========================================"

test_api_with_slash() {
  local url="$1"
  local description="$2"
  
  echo ""
  echo "Testing: $description"
  echo "URL: $url"
  echo "----------------------------------------"
  
  response=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
    -H "x-api-key: $API_KEY" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    "$url")
  
  http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_CODE:/d')
  
  echo "HTTP Status Code: $http_code"
  
  if echo "$body" | grep -q "{"; then
    echo "Response Type: JSON ✅"
    echo "Body: $body"
  elif echo "$body" | grep -q "<!DOCTYPE html>"; then
    echo "Response Type: HTML (Still 404) ❌"
    echo "First line: $(echo "$body" | head -n1)"
  else
    echo "Response Type: Other"
    echo "Body: $body"
  fi
}

# Test the working patterns with trailing slash
echo "Testing URLs WITH TRAILING SLASH (from redirects):"

test_api_with_slash "$BASE_URL/sm-admin/api/health/" "Health endpoint with trailing slash"
test_api_with_slash "$BASE_URL/sm-admin/api/debug/" "Debug endpoint with trailing slash"  
test_api_with_slash "$BASE_URL/sm-admin/api/login/" "Login endpoint with trailing slash"

# Also test the app router version with trailing slash
test_api_with_slash "$BASE_URL/sm-admin/app/api/health/" "App router health with trailing slash"
test_api_with_slash "$BASE_URL/sm-admin/app/api/debug/" "App router debug with trailing slash"

echo ""
echo "========================================"
echo "POST REQUEST TEST (Login with trailing slash):"
echo "========================================"

echo ""
echo "Testing: POST Login with trailing slash"
echo "URL: $BASE_URL/sm-admin/api/login/"
echo "----------------------------------------"

login_response=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -X POST \
  -H "x-api-key: $API_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email": "benefitadmin@sinarmasmining.com", "password": "benefit2024"}' \
  "$BASE_URL/sm-admin/api/login/")

login_code=$(echo "$login_response" | grep "HTTP_CODE:" | cut -d: -f2)
login_body=$(echo "$login_response" | sed '/HTTP_CODE:/d')

echo "HTTP Status Code: $login_code"
if echo "$login_body" | grep -q "{"; then
  echo "Response Type: JSON ✅"
  echo "Login Response: $login_body"
else
  echo "Response Type: Other"
  echo "Body: $login_body"
fi

echo ""
echo "========================================"
echo "CONCLUSION:"
echo "If trailing slash URLs return JSON = SUCCESS!"  
echo "We need to update Postman collection to use trailing slash"
echo "========================================"