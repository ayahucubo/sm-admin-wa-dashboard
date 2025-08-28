import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');
    const range = searchParams.get('range') || 'A:Z';
    const tabId = searchParams.get('tabId') || '333075918'; // Default to CC Benefit tab
    
    console.log('API Request - Sheet ID:', sheetId, 'Range:', range, 'Tab ID:', tabId);
    
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

    // Approach 1: Try the published web CSV export
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/e/${extractedSheetId}/pub?output=csv&gid=${tabId}`;
      console.log('Trying Approach 1 - URL:', csvUrl);
      
      const response = await fetch(csvUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('Approach 1 Response Status:', response.status, response.statusText);
      
      if (response.ok) {
        csvText = await response.text();
        console.log('Approach 1 Success - CSV Length:', csvText.length);
        success = true;
      } else {
        lastError = `Approach 1 failed with status ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      lastError = `Approach 1 error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log('Approach 1 failed:', error);
    }

    // Approach 2: Try the gviz CSV export
    if (!success) {
      try {
        const csvUrl2 = `https://docs.google.com/spreadsheets/d/e/${extractedSheetId}/gviz/tq?tqx=out:csv&gid=${tabId}`;
        console.log('Trying Approach 2 - URL:', csvUrl2);
        
        const response2 = await fetch(csvUrl2, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log('Approach 2 Response Status:', response2.status, response2.statusText);
        
        if (response2.ok) {
          csvText = await response2.text();
          console.log('Approach 2 Success - CSV Length:', csvText.length);
          success = true;
        } else {
          lastError = `Approach 2 failed with status ${response2.status}: ${response2.statusText}`;
        }
      } catch (error) {
        lastError = `Approach 2 error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.log('Approach 2 failed:', error);
      }
    }

    // Approach 3: Try the direct CSV export
    if (!success) {
      try {
        const csvUrl3 = `https://docs.google.com/spreadsheets/d/e/${extractedSheetId}/export?format=csv&gid=${tabId}`;
        console.log('Trying Approach 3 - URL:', csvUrl3);
        
        const response3 = await fetch(csvUrl3, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log('Approach 3 Response Status:', response3.status, response3.statusText);
        
        if (response3.ok) {
          csvText = await response3.text();
          console.log('Approach 3 Success - CSV Length:', csvText.length);
          success = true;
        } else {
          lastError = `Approach 3 failed with status ${response3.status}: ${response3.statusText}`;
        }
      } catch (error) {
        lastError = `Approach 3 error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.log('Approach 3 failed:', error);
      }
    }

    // If all approaches fail, return a more detailed error
    if (!success) {
      console.error('All approaches to fetch sheet data failed. Last error:', lastError);
      return NextResponse.json({ 
        error: 'Failed to fetch sheet data',
        details: `The Google Sheet may not be publicly accessible or the URL format is incorrect. Please ensure the sheet is published to the web or use proper Google Sheets API authentication. Last error: ${lastError}`,
        sheetId: extractedSheetId,
        troubleshooting: [
          '1. Make sure the Google Sheet is published to the web',
          '2. Check that the sheet ID is correct',
          '3. Ensure the sheet has proper permissions (anyone with link can view)',
          '4. Try accessing the sheet URL directly in a browser',
          '5. Verify the gid parameter matches your sheet tab'
        ]
      }, { status: 500 });
    }
    
    // Parse CSV data
    const rows = parseCSV(csvText);
    console.log('Parsed rows:', rows.length);
    
    return NextResponse.json({ 
      values: rows,
      message: 'Data fetched successfully',
      rowCount: rows.length,
      sheetId: extractedSheetId
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
