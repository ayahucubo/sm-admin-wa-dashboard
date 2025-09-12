# Deployment Troubleshooting Guide

## Issue: Google Sheets Access Fails on Production Server

### Problem Description
- Works fine locally (localhost)
- Fails on production server with error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
- Affects pages: CC Benefit Mapping, CC PP Mapping, Menu Master

### Root Causes & Solutions

## 1. Google Sheets Publishing Configuration

### Problem: Sheet not properly published to web
**Solution:**
1. Open your Google Sheet
2. Go to **File** → **Share** → **Publish to the web**
3. Select "Entire Document" 
4. Choose "CSV" format (not "Web page")
5. Check "Automatically republish when changes are made"
6. Click **Publish**
7. Copy the published URL (format: `https://docs.google.com/spreadsheets/d/e/2PACX-...`)

### Problem: Incorrect permissions
**Solution:**
1. Click **Share** button in Google Sheet
2. Change to "Anyone with the link can view"
3. Ensure "Restrict access to your organization" is UNCHECKED

## 2. Server Environment Issues

### Problem: Server blocks external API calls
**Solution:**
Check your hosting provider's firewall settings:
- Ensure outbound HTTPS requests to `docs.google.com` are allowed
- Check if your server has internet access
- Verify no proxy/firewall is blocking Google domains

### Problem: Different User-Agent handling
**Solution:**
The updated API route now includes proper headers:
```typescript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Accept': 'text/csv, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache'
}
```

## 3. Network & Timeout Issues

### Problem: Slow server response or timeouts
**Solution:**
- Increased timeout to 15 seconds in API route
- Added AbortSignal for timeout handling
- Multiple fallback URL attempts

## 4. URL Format Issues

### Problem: Incorrect Google Sheets URL format
**Current Configuration:**
- Sheet ID: `2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_`
- CC Benefit Tab ID: `333075918`

**Test URLs:**
1. `https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/pub?output=csv&gid=333075918`
2. `https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/export?format=csv&gid=333075918`

**Verification Steps:**
1. Test each URL in your browser
2. Should download CSV file, not show HTML page
3. If you get HTML, the sheet isn't properly published

## 5. Production Environment Variables

### Problem: Missing environment configuration
**Solution:**
Create `.env.production` or set environment variables in your deployment platform:

```bash
NODE_ENV=production
GOOGLE_SHEETS_DEFAULT_SHEET_ID=2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_
GOOGLE_SHEETS_CC_BENEFIT_TAB_ID=333075918
ENABLE_SHEETS_DEBUG=true
```

## 6. CORS Issues

### Problem: Cross-origin request blocking
**Solution:**
The updated implementation uses server-side fetch (no CORS issues) but if you encounter problems:

1. Check your Next.js configuration
2. Ensure API routes are properly configured
3. Verify your production domain settings

## 7. Backup Data System

### New Feature: Automatic Fallback
The updated system now includes:
- Automatic backup data when Google Sheets fails
- Graceful error handling with user-friendly messages
- Multiple retry attempts with different URL formats

## Testing Steps for Production

### 1. Manual Testing
Test these URLs directly in browser:
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/pub?output=csv&gid=333075918
```

### 2. API Testing
Test your API endpoint:
```
https://your-domain.com/api/sheets?sheetId=2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_&tabId=333075918
```

### 3. Check Browser Console
Open browser developer tools on your production site and check:
- Network tab for failed requests
- Console tab for error messages
- The detailed error information now includes troubleshooting steps

## Common Error Messages & Solutions

### "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
**Cause:** Google Sheets returning HTML error page instead of CSV
**Solution:** Fix sheet publishing settings (see Section 1)

### "Failed to fetch sheet data"
**Cause:** Network/timeout issues
**Solution:** Check server internet access and firewall settings

### "Sheet not found" or 404 errors  
**Cause:** Incorrect sheet ID or tab ID
**Solution:** Verify sheet ID and tab ID are correct

## Emergency Backup Plan

If Google Sheets continues to fail:
1. The system will automatically use backup data
2. Users will see a warning message
3. You can manually update backup data in `/src/utils/backupData.ts`
4. Consider implementing a database solution for production data

## Support Information

For additional help:
1. Check the detailed error logs in your server console
2. The API now provides comprehensive troubleshooting information
3. Test the Google Sheets URLs manually before deployment
4. Ensure all environment variables are properly set in production
