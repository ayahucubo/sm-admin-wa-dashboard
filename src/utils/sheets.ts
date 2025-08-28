// Utility function to fetch data from Google Sheets
export async function fetchGoogleSheetData(sheetId: string, range: string = 'A:Z', tabId?: string) {
  try {
    // Convert Google Sheets URL to API endpoint
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=YOUR_API_KEY`;
    
    // For now, we'll use a proxy approach since we need API key
    // You can replace this with actual Google Sheets API implementation
    const params = new URLSearchParams({
      sheetId: sheetId,
      range: range
    });
    
    if (tabId) {
      params.append('tabId', tabId);
    }
    
    const response = await fetch(`/api/sheets?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || 'Failed to fetch sheet data');
    }
    
    const data = await response.json();
    
    if (!data.values) {
      console.warn('No values found in sheet data:', data);
      return [];
    }
    
    return data.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error; // Re-throw to let the calling code handle it
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
