#!/bin/bash

# API Routing Debug Script - Test Different URL Patterns
# This script tests various URL patterns to identify working routes

BASE_URL="https://wecare.techconnect.co.id"
API_KEY="sm2024_admin_api_key_secure_access"

echo "========================================"
echo "API ROUTING DEBUG TEST"
echo "Testing different URL patterns..."
echo "========================================"

# Function to test URL and show detailed response
test_api_url() {
  local url="$1"
  local description="$2"
  
  echo ""
  echo "Testing: $description"
  echo "URL: $url"
  echo "----------------------------------------"
  
  # Test with curl and show response code, headers, and first few lines of content
  response=$(curl -s -w "\nHTTP_CODE:%{http_code}\nREDIRECT_URL:%{redirect_url}\n" \
    -H "x-api-key: $API_KEY" \
    -H "Accept: application/json" \
    "$url")
  
  # Extract HTTP code
  http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
  redirect_url=$(echo "$response" | grep "REDIRECT_URL:" | cut -d: -f2-)
  body=$(echo "$response" | sed '/HTTP_CODE:/d' | sed '/REDIRECT_URL:/d')
  
  echo "HTTP Status Code: $http_code"
  if [ ! -z "$redirect_url" ]; then
    echo "Redirect URL: $redirect_url"
  fi
  
  # Check if response is JSON or HTML
  if echo "$body" | grep -q "<!DOCTYPE html>"; then
    echo "Response Type: HTML (404 page)"
    echo "First line: $(echo "$body" | head -n1)"
  elif echo "$body" | grep -q "{"; then
    echo "Response Type: JSON"
    echo "Body: $body"
  else
    echo "Response Type: Other"
    echo "Body: $body"
  fi
}

# Test different URL patterns for health endpoint
echo "Testing HEALTH ENDPOINT with different URL patterns:"

test_api_url "$BASE_URL/api/health" "Direct API path (no basePath)"
test_api_url "$BASE_URL/sm-admin/api/health" "With basePath prefix"
test_api_url "$BASE_URL/sm-admin/app/api/health" "Full app router path with basePath"
test_api_url "$BASE_URL/app/api/health" "App router path without basePath"

echo ""
echo "========================================"
echo "Testing LOGIN ENDPOINT with different patterns:"

test_api_url "$BASE_URL/api/login" "Direct login API (no basePath)"
test_api_url "$BASE_URL/sm-admin/api/login" "Login with basePath prefix"  
test_api_url "$BASE_URL/sm-admin/app/api/login" "Full login app router path with basePath"
test_api_url "$BASE_URL/app/api/login" "Login app router path without basePath"

echo ""
echo "========================================"
echo "Testing DEBUG ENDPOINT:"

test_api_url "$BASE_URL/api/debug" "Direct debug API (no basePath)"
test_api_url "$BASE_URL/sm-admin/api/debug" "Debug with basePath prefix"
test_api_url "$BASE_URL/sm-admin/app/api/debug" "Full debug app router path with basePath"
test_api_url "$BASE_URL/app/api/debug" "Debug app router path without basePath"

echo ""
echo "========================================"
echo "WEBSITE TESTS (should work):"

test_api_url "$BASE_URL/sm-admin" "Main website"
test_api_url "$BASE_URL/sm-admin/admin" "Admin dashboard"

echo ""
echo "========================================"
echo "DEBUG SUMMARY:"
echo "1. Check which URL pattern returns JSON (success)"
echo "2. Check which returns 404 HTML"
echo "3. Check for any redirects"
echo "4. Update Postman collection with working pattern"
echo "========================================"