import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');
    const range = searchParams.get('range') || 'A:Z';
    const tabId = searchParams.get('tabId') || '333075918'; // Default to CC Benefit tab
    
    console.log('=== SHEETS API REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User Agent:', request.headers.get('user-agent'));
    console.log('Origin:', request.headers.get('origin'));
    console.log('Referer:', request.headers.get('referer'));
    console.log('Sheet ID:', sheetId);
    console.log('Range:', range);
    console.log('Tab ID:', tabId);
    
    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID is required' }, { status: 400 });
    }

    // Extract sheet ID from the full URL
    let extractedSheetId = sheetId;
    
    // Handle different URL formats
    if (sheetId.includes('/')) {
      if (sheetId.includes('/d/e/')) {
        // Published web format: /d/e/2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_/pubhtml
        const match = sheetId.match(/\/d\/e\/([^\/]+)/);
        if (match) {
          extractedSheetId = match[1];
        }
      } else if (sheetId.includes('/d/')) {
        // Standard format: /d/1Qvcx-g5py-Y4MJTllAHtcLfaNXQNmBQKHhAETcVbwDc
        extractedSheetId = sheetId.split('/')[5];
      }
    }

    console.log('Extracted Sheet ID:', extractedSheetId);

    // Try multiple approaches to fetch the sheet data
    let csvText = '';
    let success = false;
    let lastError = '';
    let successfulUrl = '';

    // List of URLs to try in order of preference
    const urlsToTry = [
      {
        name: 'Published CSV Export with Single=true (User Provided)',
        url: `https://docs.google.com/spreadsheets/d/e/${extractedSheetId}/pub?gid=${tabId}&single=true&output=csv`,
      },
      {
        name: 'Published CSV Export',
        url: `https://docs.google.com/spreadsheets/d/e/${extractedSheetId}/pub?output=csv&gid=${tabId}`,
      },
      {
        name: 'Direct CSV Export',
        url: `https://docs.google.com/spreadsheets/d/e/${extractedSheetId}/export?format=csv&gid=${tabId}`,
      },
      {
        name: 'GViz CSV Export',
        url: `https://docs.google.com/spreadsheets/d/e/${extractedSheetId}/gviz/tq?tqx=out:csv&gid=${tabId}`,
      }
    ];

    for (const urlConfig of urlsToTry) {
      try {
        console.log(`=== Trying ${urlConfig.name} ===`);
        console.log('URL:', urlConfig.url);
        
        const response = await fetch(urlConfig.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/csv, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          // Add timeout
          signal: AbortSignal.timeout(15000) // 15 seconds timeout
        });
        
        console.log(`${urlConfig.name} Response Status:`, response.status, response.statusText);
        console.log(`${urlConfig.name} Response Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const responseText = await response.text();
          console.log(`${urlConfig.name} Response Length:`, responseText.length);
          console.log(`${urlConfig.name} Response Preview (first 200 chars):`, responseText.substring(0, 200));
          
          // Check if response is actually CSV data (not HTML error page)
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            console.log(`${urlConfig.name} returned HTML instead of CSV - likely an error page`);
            lastError = `${urlConfig.name} returned HTML error page instead of CSV data`;
            continue;
          }
          
          // Check if we got meaningful CSV data
          if (responseText.trim().length === 0) {
            console.log(`${urlConfig.name} returned empty response`);
            lastError = `${urlConfig.name} returned empty response`;
            continue;
          }
          
          csvText = responseText;
          successfulUrl = urlConfig.url;
          success = true;
          console.log(`✅ ${urlConfig.name} SUCCESS!`);
          break;
        } else {
          const errorText = await response.text();
          lastError = `${urlConfig.name} failed with status ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 200)}`;
          console.log(`❌ ${urlConfig.name} failed:`, lastError);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = `${urlConfig.name} error: ${errorMessage}`;
        console.log(`❌ ${urlConfig.name} exception:`, error);
      }
    }

    // If all approaches fail, return a more detailed error
    if (!success) {
      console.error('=== ALL APPROACHES FAILED ===');
      console.error('Last error:', lastError);
      console.error('Request time:', Date.now() - startTime, 'ms');
      
      return NextResponse.json({ 
        error: 'Failed to fetch sheet data',
        details: `Unable to access Google Sheet data. This usually happens when the sheet is not properly published to the web or has access restrictions.`,
        troubleshooting: {
          steps: [
            '1. Open your Google Sheet',
            '2. Go to File → Share → Publish to the web',
            '3. Select "Entire Document" and "Web page" or "CSV"',
            '4. Check "Automatically republish when changes are made"',
            '5. Click "Publish" and copy the URL',
            '6. Also go to Share button and set "Anyone with the link can view"'
          ],
          technicalDetails: {
            sheetId: extractedSheetId,
            tabId: tabId,
            lastError: lastError,
            requestTime: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'unknown'
          },
          testUrls: urlsToTry.map(config => config.url)
        }
      }, { status: 500 });
    }
    
    // Parse CSV data
    const rows = parseCSV(csvText);
    console.log('=== PARSING COMPLETE ===');
    console.log('Parsed rows:', rows.length);
    console.log('Processing time:', Date.now() - startTime, 'ms');
    
    return NextResponse.json({ 
      values: rows,
      message: 'Data fetched successfully',
      metadata: {
        rowCount: rows.length,
        sheetId: extractedSheetId,
        tabId: tabId,
        successfulUrl: successfulUrl,
        processingTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch sheet data',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

function parseCSV(csvText: string): string[][] {
  console.log('=== CSV PARSING ===');
  console.log('CSV text length:', csvText.length);
  console.log('First 500 chars of CSV:', csvText.substring(0, 500));
  
  const lines = csvText.split('\n');
  console.log('Total lines:', lines.length);
  
  const parsedLines = lines
    .filter(line => line.trim() !== '')
    .map((line, index) => {
      try {
        // More robust CSV parsing
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
            current = '';
          } else {
            current += char;
          }
        }
        
        values.push(current.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
        
        if (index < 3) {
          console.log(`Line ${index + 1}:`, values);
        }
        
        return values;
      } catch (error) {
        console.error(`Error parsing line ${index + 1}:`, error, line);
        return [];
      }
    })
    .filter(values => values.length > 0); // Remove empty arrays
    
  console.log('Parsed lines count:', parsedLines.length);
  console.log('First 3 parsed lines:', parsedLines.slice(0, 3));
  
  return parsedLines;
}
