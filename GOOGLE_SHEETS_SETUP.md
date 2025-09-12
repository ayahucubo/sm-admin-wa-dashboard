# Google Sheets Setup for Public Access

### WoYour curren**CC PP Mapping** (You provided this working format):
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6LIVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/pub?gid=1358267710&single=true&output=csv
```

**Menu Master** (Your provided format):
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6LIVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/pub?gid=2112688959&single=true&output=csv
```eet configuration:
- Sheet ID: `2PACX-1vS0mDV9rxyyDEtW61ZT07q6LIVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_`
- CC Benefit Tab ID: `333075918` (for mapping CC benefits)
- CC PP Tab ID: `1358267710` (for mapping CC PP)
- Menu Master Tab ID: `2112688959` (for menu master data)g URLs:

**CC Benefit Mapping** (Working format):
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/pub?gid=333075918&single=true&output=csv
```

**CC PP Mapping** (You provided this working format):
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/pub?gid=1358267710&single=true&output=csv
```ublish Your Google Sheet to the Web

1. Open your Google Sheet
2. Go to **File** → **Share** → **Publish to the web**
3. In the dialog box:
   - **Link tab**: Select "Entire Document" or specific sheet
   - **Embed tab**: Choose "Web page" or "CSV"
   - Check "Automatically republish when changes are made"
   - Click **Publish**
4. Copy the published URL (should look like: `https://docs.google.com/spreadsheets/d/e/2PACX-...`)

## Step 2: Set Proper Sheet Permissions

1. Click **Share** button in your Google Sheet
2. Change access to "Anyone with the link can view"
3. Make sure "Restrict access to your organization" is unchecked

## Step 3: Get the Correct Sheet ID and Tab ID

### Published Sheet ID Format:
- Published URL: `https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/pubhtml`
- Sheet ID: `2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_`

### Get Tab ID (gid):
1. Go to the specific tab in your sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit#gid=333075918`
3. The number after `gid=` is your tab ID (e.g., `333075918`)

## Step 4: Test the URLs

Test these URLs in your browser to ensure they work:

1. **CSV Export**: `https://docs.google.com/spreadsheets/d/e/[PUBLISHED_SHEET_ID]/pub?output=csv&gid=[TAB_ID]`
2. **Alternative**: `https://docs.google.com/spreadsheets/d/e/[PUBLISHED_SHEET_ID]/export?format=csv&gid=[TAB_ID]`

## Current Configuration

Your current sheet configuration:
- Sheet ID: `2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_`
- CC Benefit Tab ID: `333075918` (for mapping CC benefits)
- CC PP Tab ID: `1358267710` (for mapping CC PP)

## Working URLs:

**CC Benefit Mapping** (You provided this working format):
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/pub?gid=333075918&single=true&output=csv
```

**CC PP Mapping** (Alternative tab):
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/pub?gid=1358267710&single=true&output=csv
```

**Important:** The system automatically detects which tab to use based on the page being accessed:
- `/admin/mapping-cc-benefit/` uses Tab ID `333075918`
- `/admin/mapping-cc-pp/` uses Tab ID `1358267710`
- `/admin/menu-master/` uses Tab ID `2112688959`
