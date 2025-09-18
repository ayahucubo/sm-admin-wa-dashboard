import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1j2B8x5M8vkizDmA100dqSfEtJ5XYmDf5c0q5M3vtbGE/export?format=csv&gid=0';

interface KnowledgeBenefitRecord {
  ID: string;
  sme: string;
  Status_Update: string;
  'Status Train': string;  // Changed to match CSV header with space
  skema: string;
  company: string;
  kategori: string;
  kategori_sub: string;
  knowledge_code: string;
  bab: string;
  bab_no: string;
  bagian: string;
  paragraf: string;
  pasal: string;
  pasal_no: string;
  pasal_description: string;
  keyword: string;
  text: string;
}

// Simple HTML table parser function for Google Sheets pubhtml
function parseGoogleSheetsHTML(htmlText: string): KnowledgeBenefitRecord[] {
  const records: KnowledgeBenefitRecord[] = [];
  
  try {
    console.log('Starting HTML parsing...');
    
    // Google Sheets pubhtml uses different table structures, let's try multiple approaches
    let tableMatch = htmlText.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    
    if (!tableMatch) {
      // Try looking for div with table-like content
      console.log('No standard table found, looking for Google Sheets table structure...');
      
      // Google Sheets often uses div elements with specific classes
      const sheetsTableMatch = htmlText.match(/<div[^>]*class="[^"]*waffle[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (sheetsTableMatch) {
        console.log('Found Google Sheets waffle container');
        
        // Look for tbody within the waffle container
        const tbodyMatch = sheetsTableMatch[1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
        if (tbodyMatch) {
          tableMatch = [`<table>${tbodyMatch[0]}</table>`, tbodyMatch[1]];
          console.log('Found tbody within waffle container');
        }
      }
    }
    
    if (!tableMatch) {
      // Try alternative: look for any tbody directly
      console.log('Looking for tbody directly...');
      const tbodyMatch = htmlText.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
      if (tbodyMatch) {
        tableMatch = [`<table>${tbodyMatch[0]}</table>`, tbodyMatch[1]];
        console.log('Found direct tbody');
      }
    }
    
    if (!tableMatch) {
      console.log('No table structure found. HTML preview:', htmlText.substring(0, 500));
      return records;
    }
    
    const tableContent = tableMatch[1];
    console.log('Table content found, length:', tableContent.length);
    
    const rowMatches = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    
    if (!rowMatches || rowMatches.length < 1) {
      console.log('No rows found in table. Table content preview:', tableContent.substring(0, 500));
      return records;
    }
    
    console.log('Found rows:', rowMatches.length);
    
    // Parse header row (first row)
    const headerRow = rowMatches[0];
    const headerCells = headerRow.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [];
    const headers = headerCells.map(cell => {
      const text = cell.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      return text;
    });
    
    console.log('Headers found:', headers);
    
    if (headers.length === 0) {
      console.log('No headers found. Header row:', headerRow);
      return records;
    }
    
    // Parse data rows (skip header row)
    for (let i = 1; i < rowMatches.length; i++) {
      const row = rowMatches[i];
      const cells = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [];
      
      if (cells.length === 0) continue;
      
      const values = cells.map(cell => {
        const text = cell.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        return text;
      });
      
      // Create record object
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      
      // Only add if we have some meaningful data
      if (Object.values(record).some(value => value && value.toString().trim())) {
        records.push(record as KnowledgeBenefitRecord);
      }
    }
    
    console.log('Parsed records:', records.length);
    return records;
    
  } catch (error) {
    console.error('Error parsing HTML:', error);
    console.log('HTML sample for debugging:', htmlText.substring(0, 1000));
    return records;
  }
}

// Simple CSV parser function (keeping as fallback)
function parseCSV(csvText: string): KnowledgeBenefitRecord[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const records: KnowledgeBenefitRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // More robust CSV parsing to handle commas within quoted fields
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Push the last value
    
    // Ensure we have the right number of columns
    if (values.length >= headers.length) {
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record as KnowledgeBenefitRecord);
    }
  }
  
  return records;
}

export async function GET(request: NextRequest) {
  const authPayload = await authenticateAdmin(request);
  if (!authPayload) {
    return createUnauthorizedResponse();
  }

  try {
    console.log('Fetching CSV data from Google Sheets...');
    
    // Fetch CSV data from Google Sheets
    const response = await fetch(SHEETS_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv,text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      cache: 'no-cache' // Always get fresh data
    });
    
    if (!response.ok) {
      console.error('Failed to fetch CSV:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        error: `Failed to fetch CSV data: ${response.status} ${response.statusText}`
      }, { status: 500 });
    }
    
    const csvText = await response.text();
    console.log('CSV data fetched successfully, length:', csvText.length);
    
    // Debug: Print first 500 characters of CSV  
    console.log('CSV preview (first 500 chars):', csvText.substring(0, 500));
    
    // Parse CSV data
    const records = parseCSV(csvText);
    console.log('Parsed records count:', records.length);
    
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const kategori = searchParams.get('kategori') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Filter records based on search criteria
    let filteredRecords = records;
    
    if (search) {
      filteredRecords = records.filter(record => 
        Object.values(record).some(value => 
          value && value.toString().toLowerCase().includes(search)
        )
      );
    }
    
    if (kategori) {
      filteredRecords = filteredRecords.filter(record => 
        record.kategori && record.kategori.toLowerCase().includes(kategori.toLowerCase())
      );
    }
    
    // Apply pagination
    const totalRecords = filteredRecords.length;
    const paginatedRecords = filteredRecords.slice(offset, offset + limit);
    
    // Get unique categories for filter options
    const categories = [...new Set(records.map(r => r.kategori).filter(Boolean))];
    
    return NextResponse.json({
      success: true,
      data: paginatedRecords,
      total: totalRecords,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalRecords
      },
      filters: {
        categories: categories.sort()
      }
    });
    
  } catch (error) {
    console.error('Error in knowledge-benefit API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Also support POST for advanced filtering
export async function POST(request: NextRequest) {
  const authPayload = await authenticateAdmin(request);
  if (!authPayload) {
    return createUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { filters = {}, pagination = {} } = body;
    
    console.log('POST request with filters:', filters);
    
    // Fetch HTML data
    const response = await fetch(SHEETS_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,text/plain,*/*',
        'User-Agent': 'SM-Admin-Dashboard/1.0'
      },
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch HTML data: ${response.status}`
      }, { status: 500 });
    }
    
    const htmlText = await response.text();
    const records = parseGoogleSheetsHTML(htmlText);
    
    // Apply filters
    let filteredRecords = records;
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredRecords = filteredRecords.filter(record => 
        Object.values(record).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
      );
    }
    
    if (filters.kategori) {
      filteredRecords = filteredRecords.filter(record => 
        record.kategori && record.kategori.toLowerCase().includes(filters.kategori.toLowerCase())
      );
    }
    
    if (filters.company) {
      filteredRecords = filteredRecords.filter(record => 
        record.company && record.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }
    
    // Apply pagination
    const limit = pagination.limit || 50;
    const offset = pagination.offset || 0;
    const totalRecords = filteredRecords.length;
    const paginatedRecords = filteredRecords.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: paginatedRecords,
      total: totalRecords,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalRecords
      }
    });
    
  } catch (error) {
    console.error('Error in POST knowledge-benefit API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}