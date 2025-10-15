// Company code utility for fetching user company codes from database and SAP API
import { query } from '@/utils/database';

// Interface for database user response
interface DBUserResponse {
  hp?: string;
  user_name?: string;
  full_name?: string;
  company_code?: string;
  company_code_desc?: string;
  position_name?: string;
  position_id?: string;
  personal_area?: string;
  personal_subarea?: string;
  position_level_id?: string;
}

// Interface for live SAP API response
interface SAPApiResponse {
  UserName?: string;
  FullName?: string;
  CompanyCode?: string;
  CompanyCodeDesc?: string;
  PositionName?: string;
  PositionId?: string;
  PersonalArea?: string;
  PersonalSubarea?: string;
  PositionLevelId?: string;
  EmployeeGroup?: string;
  Hp?: string;
}

// Interface for company code data
export interface CompanyCodeData {
  phoneNumber: string;
  companyCode: string;
  companyName: string;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  position?: string;
  lastUpdated: string;
  success: boolean;
  error?: string;
}

/**
 * Fetch company code from live SAP API
 * @param phoneNumber The phone number to query (format: 628xxx or +628xxx)
 * @returns Promise<CompanyCodeData>
 */
async function fetchFromLiveSAPAPI(phoneNumber: string): Promise<CompanyCodeData> {
  const startTime = Date.now();
  
  try {
    const startTime = Date.now();
    console.log(`🌐 Fetching from live SAP API for phone: ${phoneNumber}`);
    
    // Clean phone number (remove + and spaces)
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\+]/g, '');
    
    // Prepare the SAP API request
    const sapApiBaseUrl = process.env.SAP_API_BASE_URL || 'http://fiori.sinarmasmining.com:8029';
    const sapApiPath = process.env.SAP_API_PATH || '/sap/SMM_API/LMS/USER_SYNC/GET';
    const sapClient = process.env.SAP_CLIENT || '300';
    const sapApiUrl = `${sapApiBaseUrl}${sapApiPath}?sap-client=${sapClient}&req={"IM_HP":"${cleanPhoneNumber}"}`;
    
    // Use SAP credentials from environment variables or fallback
    const sapUsername = process.env.SAP_USERNAME || 'hris';
    const sapPassword = process.env.SAP_PASSWORD || 'hris123';
    const credentials = Buffer.from(`${sapUsername}:${sapPassword}`).toString('base64');
    
    const response = await fetch(sapApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`SAP API HTTP error! status: ${response.status}`);
    }

    const sapResponse = await response.json();
    const responseTime = Date.now() - startTime;

    // SAP API returns an array of objects, get the first one
    let sapData: SAPApiResponse | null = null;
    
    if (Array.isArray(sapResponse) && sapResponse.length > 0) {
      sapData = sapResponse[0]; // Get first user from array
    } else if (sapResponse && typeof sapResponse === 'object' && !Array.isArray(sapResponse)) {
      sapData = sapResponse; // Handle single object response (fallback)
    }

    // Check if we got valid data
    if (sapData && sapData.UserName && sapData.CompanyCode) {
      // TypeScript assertion: we know sapData is not null due to the check above
      const validSapData = sapData as SAPApiResponse;
      
      const companyResult: CompanyCodeData = {
        phoneNumber: cleanPhoneNumber,
        companyCode: validSapData.CompanyCode || 'UNKNOWN',
        companyName: validSapData.CompanyCodeDesc || 'Unknown Company',
        employeeId: validSapData.PositionId || undefined,
        employeeName: validSapData.FullName || undefined,
        department: validSapData.PersonalArea || undefined,
        position: validSapData.PositionName || undefined,
        lastUpdated: new Date().toISOString(),
        success: true
      };

      console.log(`✅ SAP API: Company code fetched successfully in ${responseTime}ms:`, {
        phoneNumber: companyResult.phoneNumber,
        companyCode: companyResult.companyCode,
        companyName: companyResult.companyName
      });

      return companyResult;
    } else {
      console.log(`⚠️ SAP API: No data found for ${cleanPhoneNumber} (${responseTime}ms)`);
      console.log(`📊 SAP Response Debug:`, {
        isArray: Array.isArray(sapResponse),
        length: Array.isArray(sapResponse) ? sapResponse.length : 'N/A',
        type: typeof sapResponse,
        hasData: !!sapData
      });
      
      return {
        phoneNumber: cleanPhoneNumber,
        companyCode: 'NOT_FOUND',
        companyName: 'User not found in SAP system',
        lastUpdated: new Date().toISOString(),
        success: true
      };
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ SAP API error for ${phoneNumber} (${responseTime}ms):`, error);

    return {
      phoneNumber: phoneNumber,
      companyCode: 'ERROR',
      companyName: `SAP API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastUpdated: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch company code from database using phone number
 * @param phoneNumber The phone number to query (format: 628xxx or +628xxx)
 * @returns Promise<CompanyCodeData>
 */
export async function fetchCompanyCodeFromSAP(phoneNumber: string): Promise<CompanyCodeData> {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Fetching company code for phone: ${phoneNumber}`);
    
    // Clean phone number (remove + and spaces)
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\+]/g, '');
    
    // Validate phone number format
    if (!cleanPhoneNumber.match(/^62\d{9,13}$/)) {
      throw new Error('Invalid Indonesian phone number format');
    }

    // Query database for user information - check environment 100 first, then 200
    const queryText = `
      SELECT 
        hp,
        user_name,
        full_name,
        company_code,
        company_code_desc,
        position_name,
        position_id,
        personal_area,
        personal_subarea,
        position_level_id,
        environment_id
      FROM n8n_ext_saphr_employee01 
      WHERE hp = $1 
        AND environment_id IN ('100', '200')
        AND (employee_group IS NULL OR employee_group != 'Terminated')
      ORDER BY 
        CASE WHEN environment_id = '100' THEN 1 ELSE 2 END,
        environment_id
      LIMIT 1
    `;

    console.log('Database query:', queryText);
    console.log('Query parameters:', [cleanPhoneNumber]);

    const result = await query(queryText, [cleanPhoneNumber]);
    const responseTime = Date.now() - startTime;
    
    if (result.rows && result.rows.length > 0) {
      const userData: DBUserResponse = result.rows[0];
      
      const companyResult: CompanyCodeData = {
        phoneNumber: cleanPhoneNumber,
        companyCode: userData.company_code || 'UNKNOWN',
        companyName: userData.company_code_desc || 'Unknown Company',
        employeeId: userData.position_id,
        employeeName: userData.full_name,
        department: userData.personal_area,
        position: userData.position_name,
        lastUpdated: new Date().toISOString(),
        success: true
      };

      console.log(`✅ Company code fetched successfully in ${responseTime}ms:`, {
        phoneNumber: companyResult.phoneNumber,
        companyCode: companyResult.companyCode,
        companyName: companyResult.companyName
      });

      return companyResult;
    } else {
      console.log(`⚠️ User not found in database: ${cleanPhoneNumber} (${responseTime}ms)`);
      console.log(`🔄 Trying live SAP API as fallback...`);
      
      // Try live SAP API as fallback
      try {
        const sapResult = await fetchFromLiveSAPAPI(cleanPhoneNumber);
        console.log(`📡 Fallback to SAP API: ${sapResult.success ? 'Success' : 'Failed'}`);
        return sapResult;
      } catch (sapError) {
        console.error(`❌ SAP API fallback failed:`, sapError);
        
        // Return NOT_FOUND if both database and SAP API fail
        const notFoundResult: CompanyCodeData = {
          phoneNumber: cleanPhoneNumber,
          companyCode: 'NOT_FOUND',
          companyName: 'User not found in database or SAP system',
          lastUpdated: new Date().toISOString(),
          success: true // Mark as successful since query worked, just no data found
        };

        return notFoundResult;
      }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Database error for ${phoneNumber} (${responseTime}ms):`, error);

    // Return error result
    const errorResult: CompanyCodeData = {
      phoneNumber: phoneNumber,
      companyCode: 'ERROR',
      companyName: 'Error fetching company',
      lastUpdated: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };

    return errorResult;
  }
}

/**
 * Batch fetch company codes for multiple phone numbers
 * @param phoneNumbers Array of phone numbers
 * @param maxConcurrent Maximum concurrent requests (default: 10)
 * @returns Promise<CompanyCodeData[]>
 */
export async function batchFetchCompanyCodes(
  phoneNumbers: string[], 
  maxConcurrent: number = 10
): Promise<CompanyCodeData[]> {
  console.log(`🔄 Batch fetching company codes for ${phoneNumbers.length} phone numbers`);
  
  const results: CompanyCodeData[] = [];
  const uniquePhoneNumbers = [...new Set(phoneNumbers)]; // Remove duplicates
  
  // Process in chunks to avoid overwhelming the database
  for (let i = 0; i < uniquePhoneNumbers.length; i += maxConcurrent) {
    const chunk = uniquePhoneNumbers.slice(i, i + maxConcurrent);
    console.log(`Processing chunk ${Math.floor(i / maxConcurrent) + 1} (${chunk.length} numbers)`);
    
    const chunkPromises = chunk.map(phoneNumber => 
      fetchCompanyCodeFromSAP(phoneNumber).catch(error => {
        console.error(`Error in batch for ${phoneNumber}:`, error);
        return {
          phoneNumber,
          companyCode: 'ERROR',
          companyName: 'Batch fetch error',
          lastUpdated: new Date().toISOString(),
          success: false,
          error: error.message
        } as CompanyCodeData;
      })
    );

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    
    // Small delay between chunks to be respectful to the database
    if (i + maxConcurrent < uniquePhoneNumbers.length) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay for database
    }
  }

  const successCount = results.filter(r => r.success).length;
  const foundCount = results.filter(r => r.success && r.companyCode !== 'NOT_FOUND').length;
  console.log(`✅ Batch fetch completed: ${successCount}/${results.length} successful, ${foundCount} found`);
  
  return results;
}

/**
 * Get unique company codes from the fetched data
 * @param companyData Array of company code data
 * @returns Array of unique company codes for filtering
 */
export function getUniqueCompanyCodes(companyData: CompanyCodeData[]): string[] {
  const codes = companyData
    .filter(data => data.success && data.companyCode !== 'ERROR' && data.companyCode !== 'NOT_FOUND')
    .map(data => data.companyCode);
  
  return [...new Set(codes)].sort();
}

/**
 * Create a phone number to company code mapping
 * @param companyData Array of company code data
 * @returns Map of phone number to company code
 */
export function createPhoneToCompanyMapping(companyData: CompanyCodeData[]): Map<string, string> {
  const mapping = new Map<string, string>();
  
  companyData.forEach(data => {
    if (data.success && data.companyCode !== 'ERROR') {
      mapping.set(data.phoneNumber, data.companyCode);
    }
  });
  
  return mapping;
}