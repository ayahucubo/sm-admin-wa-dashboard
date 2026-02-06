# Targeted API Testing for Postman Issues
param(
    [string]$BaseUrl = "https://wecare.techconnect.co.id"
)

$ApiKey = "smm-prod-55b612d24a000915f3500ea652b75c14"

Write-Host "🔍 Testing Specific Issues Found in Postman" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray

$testResults = @()

# Test cases based on Postman results
$testCases = @(
    @{ Name = "Basic Health Check"; Url = "/api/health"; ShouldWork = $true },
    @{ Name = "V1 Health Check"; Url = "/api/v1/health"; ShouldWork = $true },  
    @{ Name = "V1 API Info"; Url = "/api/v1"; ShouldWork = $true },
    @{ Name = "Chat History"; Url = "/api/v1/chat?limit=5"; ShouldWork = $true },
    @{ Name = "Active Chats"; Url = "/api/v1/chat/active?limit=5"; ShouldWork = $true }
)

foreach ($test in $testCases) {
    $fullUrl = "$BaseUrl$($test.Url)"
    Write-Host "`n🧪 Testing: $($test.Name)" -ForegroundColor Yellow
    Write-Host "   URL: $fullUrl" -ForegroundColor Gray
    
    try {
        $headers = @{
            "X-API-Key" = $ApiKey
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-WebRequest -Uri $fullUrl -Headers $headers -UseBasicParsing -ErrorAction Stop
        
        $contentType = $response.Headers['Content-Type']
        $isJson = $contentType -like "*application/json*"
        $isHtml = $contentType -like "*text/html*" -or $response.Content.Contains("<!DOCTYPE html>")
        
        if ($isJson) {
            try {
                $jsonData = $response.Content | ConvertFrom-Json
                Write-Host "   ✅ SUCCESS - JSON Response" -ForegroundColor Green
                Write-Host "   📊 Status: $($jsonData.status)" -ForegroundColor Green
                if ($jsonData.success) { Write-Host "   📊 Success: $($jsonData.success)" -ForegroundColor Green }
                if ($jsonData.message) { Write-Host "   📊 Message: $($jsonData.message)" -ForegroundColor Green }
                
                $testResults += @{
                    Test = $test.Name
                    Status = "✅ PASS"
                    Response = "JSON"
                    Details = $jsonData.status
                }
            } catch {
                Write-Host "   ⚠️  JSON Parse Error: $($_.Exception.Message)" -ForegroundColor Yellow
                $testResults += @{
                    Test = $test.Name
                    Status = "⚠️  PARTIAL"
                    Response = "JSON (parse error)"
                    Details = "Response received but parse failed"
                }
            }
        } elseif ($isHtml) {
            Write-Host "   ❌ FAIL - HTML Response (404 Page)" -ForegroundColor Red
            Write-Host "   📄 Got HTML instead of JSON - endpoint not found" -ForegroundColor Red
            
            $testResults += @{
                Test = $test.Name
                Status = "❌ FAIL"
                Response = "HTML/404"
                Details = "Endpoint not found"
            }
        } else {
            Write-Host "   ⚠️  Unknown Content Type: $contentType" -ForegroundColor Yellow
            $testResults += @{
                Test = $test.Name  
                Status = "⚠️  UNKNOWN"
                Response = $contentType
                Details = "Unexpected response type"
            }
        }
        
    } catch {
        $statusCode = "Unknown"
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        
        Write-Host "   ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   📊 Status Code: $statusCode" -ForegroundColor Red
        
        $testResults += @{
            Test = $test.Name
            Status = "❌ ERROR" 
            Response = "HTTP $statusCode"
            Details = $_.Exception.Message
        }
    }
    
    Start-Sleep -Milliseconds 500  # Brief pause between tests
}

# Results Summary
Write-Host "`n📊 COMPREHENSIVE TEST RESULTS:" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$passCount = ($testResults | Where-Object { $_.Status -like "*PASS*" }).Count
$failCount = ($testResults | Where-Object { $_.Status -like "*FAIL*" }).Count
$errorCount = ($testResults | Where-Object { $_.Status -like "*ERROR*" }).Count

foreach ($result in $testResults) {
    $color = switch -Wildcard ($result.Status) {
        "*PASS*" { "Green" }
        "*FAIL*" { "Red" }  
        "*ERROR*" { "Magenta" }
        default { "Yellow" }
    }
    
    Write-Host "$($result.Status) $($result.Test)" -ForegroundColor $color
    Write-Host "    Response: $($result.Response) | Details: $($result.Details)" -ForegroundColor Gray
}

Write-Host "`n🎯 SUMMARY:" -ForegroundColor Cyan
Write-Host "   ✅ Working: $passCount" -ForegroundColor Green
Write-Host "   ❌ Failed: $failCount" -ForegroundColor Red  
Write-Host "   🔴 Errors: $errorCount" -ForegroundColor Magenta

if ($passCount -eq $testResults.Count) {
    Write-Host "`n🎉 ALL TESTS PASSED! API is working correctly." -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some issues found. Check the details above." -ForegroundColor Yellow
    Write-Host "`n💡 Recommendations:" -ForegroundColor Cyan
    Write-Host "   1. For HTML/404 responses: Check if endpoints exist" -ForegroundColor White
    Write-Host "   2. For auth errors: Verify API key in headers" -ForegroundColor White  
    Write-Host "   3. For errors: Check server logs and deployment" -ForegroundColor White
}