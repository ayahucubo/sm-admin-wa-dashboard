import { getBackupData, convertBackupDataToRows } from './backupData';

// Utility function to fetch data from Google Sheets
export async function fetchGoogleSheetData(sheetId: string, range: string = 'A:Z', tabId?: string) {
  try {
    console.log('=== FETCHING GOOGLE SHEET DATA ===');
    console.log('Sheet ID:', sheetId);
    console.log('Range:', range);
    console.log('Tab ID:', tabId);
    
    // Convert Google Sheets URL to API endpoint
    const params = new URLSearchParams({
      sheetId: sheetId,
      range: range
    });
    
    if (tabId) {
      params.append('tabId', tabId);
    }
    
    const apiUrl = `/api/sheets?${params.toString()}`;
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      // Add timeout for client-side requests
      signal: AbortSignal.timeout(20000) // 20 seconds timeout
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorData: any = {};
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const textResponse = await response.text();
          console.log('Non-JSON error response:', textResponse);
          errorData = { 
            error: 'Server returned non-JSON response', 
            details: textResponse.substring(0, 500) 
          };
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorData = { 
          error: 'Failed to parse server response', 
          details: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
      console.error('Sheet fetch failed:', errorData);
      throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response data structure:', {
      hasValues: !!data.values,
      valuesLength: data.values?.length,
      hasMetadata: !!data.metadata,
      message: data.message
    });
    
    if (!data.values) {
      console.warn('No values found in sheet data:', data);
      return [];
    }
    
    console.log('✅ Successfully fetched sheet data:', data.values.length, 'rows');
    return data.values || [];
  } catch (error) {
    console.error('❌ Error fetching sheet data:', error);
    
    // Determine backup data type based on tabId or sheet context
    let backupType = 'cc-benefit'; // default
    if (tabId === '333075918') backupType = 'cc-benefit';
    // Add more tab ID mappings as needed
    
    console.log('🔄 Falling back to backup data type:', backupType);
    const backupData = getBackupData(backupType);
    const backupRows = convertBackupDataToRows(backupData);
    
    console.log('📋 Using backup data:', backupRows.length, 'rows');
    
    // Re-throw error but provide backup data context
    const enhancedError = new Error(
      `Google Sheets API Error: ${error instanceof Error ? error.message : 'Unknown error'}. Using backup data with ${backupRows.length} rows.`
    );
    
    // Attach backup data to error for fallback handling
    (enhancedError as any).backupData = backupRows;
    (enhancedError as any).isBackupData = true;
    
    throw enhancedError;
  }
}

// Function to parse CC Benefit data from spreadsheet rows
export function parseCCBenefitData(rows: any[][]): any[] {
  console.log('=== PARSING CC BENEFIT DATA ===');
  console.log('Input rows length:', rows?.length);
  
  if (!rows || rows.length === 0) {
    console.warn('No rows provided for parsing');
    return [];
  }

  if (rows.length < 2) {
    console.warn('Insufficient data rows for parsing (need at least header + 1 data row):', rows);
    return [];
  }
  
  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  console.log('Headers:', headers);
  console.log('Data rows count:', dataRows.length);
  console.log('First 3 data rows:', dataRows.slice(0, 3));
  
  // Parse each row preserving all original headers
  const parsedData = dataRows.map((row, index) => {
    try {
      const rowData: any = {
        id: (index + 1).toString()
      };
      
      // Map each column to its corresponding header
      headers.forEach((header, colIndex) => {
        if (header && header.trim() !== '') {
          rowData[header] = row[colIndex] ? String(row[colIndex]).trim() : '';
        }
      });
      
      // Also preserve original data for debugging
      rowData._originalRow = row;
      rowData._headers = headers;
      
      return rowData;
    } catch (error) {
      console.error(`Error parsing row ${index + 1}:`, error, row);
      return null;
    }
  }).filter(Boolean); // Remove any null entries
  
  console.log('Parsed data count:', parsedData.length);
  console.log('First 3 parsed items:', parsedData.slice(0, 3));
  
  // Filter out completely empty rows
  const filteredData = parsedData.filter(row => {
    const hasContent = Object.entries(row).some(([key, value]) => {
      if (key === 'id' || key === '_originalRow' || key === '_headers') return false;
      return value && value.toString().trim() !== '';
    });
    
    if (!hasContent) {
      console.log('Filtering out empty row:', row);
    }
    return hasContent;
  });
  
  console.log('Final filtered data count:', filteredData.length);
  console.log('Final data (first 3):', filteredData.slice(0, 3));
  
  return filteredData;
}
