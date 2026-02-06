# API Endpoint Testing Script (PowerShell)
param(
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Continue"
$ApiKey = "smm-prod-55b612d24a000915f3500ea652b75c14"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "API Endpoint Testing Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Green
Write-Host "API Key: $($ApiKey.Substring(0,10))..." -ForegroundColor Green
Write-Host ""

$endpoints = @(
    "/api/health",
    "/api/v1", 
    "/api/v1/health"
)

# Add basePath endpoints for production testing
if ($BaseUrl -like "*wecare.techconnect.co.id*") {
    Write-Host "🌐 Production Environment - Testing both direct and basePath routes" -ForegroundColor Yellow
    $basepathEndpoints = @(
        "/sm-admin/api/health",
        "/sm-admin/api/v1",
        "/sm-admin/api/v1/health"
    )
    $endpoints += $basepathEndpoints
}

$results = @()

foreach ($endpoint in $endpoints) {
    $url = "$BaseUrl$endpoint"
    Write-Host "Testing $endpoint" -ForegroundColor Yellow
    Write-Host "-" * 40 -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $url -Headers @{
            "X-API-Key" = $ApiKey
            "Content-Type" = "application/json"
        } -UseBasicParsing -ErrorAction Stop
        
        Write-Host "✅ Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
        Write-Host "   Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Green
        
        if ($response.Headers['Content-Type'] -like "*application/json*") {
            try {
                $content = $response.Content | ConvertFrom-Json
                Write-Host "   Response Data:" -ForegroundColor Green
                Write-Host "   - Status: $($content.status)" -ForegroundColor White
                Write-Host "   - Authenticated: $($content.authenticated)" -ForegroundColor White
                Write-Host "   - Timestamp: $($content.timestamp)" -ForegroundColor White
                if ($content.message) { Write-Host "   - Message: $($content.message)" -ForegroundColor White }
                $success = $true
            } catch {
                Write-Host "   ⚠️  Valid JSON but parsing error: $($_.Exception.Message)" -ForegroundColor Yellow
                $success = $false
            }
        } else {
            Write-Host "   ❌ Received non-JSON response" -ForegroundColor Red
            $success = $false
        }
        
        $results += @{
            Endpoint = $endpoint
            Status = $response.StatusCode
            Success = $success
        }
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        }
        
        $results += @{
            Endpoint = $endpoint
            Status = "ERROR"
            Success = $false
        }
    }
    
    Write-Host ""
}

Write-Host "📊 Test Results Summary:" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

$successResults = @()
$failedResults = @()

foreach ($result in $results) {
    $status = if ($result.Success) { "✅" } else { "❌" }
    $color = if ($result.Success) { "Green" } else { "Red" }
    Write-Host "$status $($result.Endpoint) - Status: $($result.Status)" -ForegroundColor $color
    
    if ($result.Success) {
        $successResults += $result
    } else {
        $failedResults += $result
    }
}

$successCount = $successResults.Count
Write-Host ""
Write-Host "🎯 Results: $successCount/$($results.Count) endpoints working correctly" -ForegroundColor Cyan

if ($successCount -eq $results.Count) {
    Write-Host "🎉 All API endpoints are working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Ready for Postman Testing:" -ForegroundColor Cyan
    Write-Host "   1. Import the updated Postman collection" -ForegroundColor White
    Write-Host "   2. Set environment variable 'baseUrl' to: $BaseUrl" -ForegroundColor White
    Write-Host "   3. Set environment variable 'apiKey' to: $ApiKey" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  Issues found with these endpoints:" -ForegroundColor Yellow
    foreach ($failed in $failedResults) {
        Write-Host "   • $($failed.Endpoint)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "✅ Working endpoints:" -ForegroundColor Green
    foreach ($success in $successResults) {
        Write-Host "   • $($success.Endpoint)" -ForegroundColor Green
    }
}