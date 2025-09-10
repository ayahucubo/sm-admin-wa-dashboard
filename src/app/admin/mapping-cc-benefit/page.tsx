"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchGoogleSheetData, parseCCBenefitData } from "@/utils/sheets";
import api from "@/utils/api";

interface CCBenefit {
  id: string;
  Company_Code?: string;
  Benefit_Name?: string;
  Description?: string;
  Category?: string;
  Status?: string;
  Created_Date?: string;
  cardType?: string;
  benefitName?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  createdAt?: string;
  [key: string]: any; // Allow dynamic property access
}

export default function MappingCCBenefitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<CCBenefit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMappingRunning, setIsMappingRunning] = useState(false);

  // Function to trigger N8N workflow
  const triggerN8NMapping = async () => {
    // Define webhook URL at the top so it's accessible in catch block
    const webhookUrl = "https://wecare.techconnect.co.id/webhook/100/app/api/ButtonActive";
    
    try {
      setIsMappingRunning(true);
      
      console.log('Triggering N8N workflow:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          action: "start_mapping",
          timestamp: new Date().toISOString(),
          source: "CC_Benefit_Mapping_Button"
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        let responseData;
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }
        } catch (parseError) {
          console.log('Could not parse response, but request was successful');
          responseData = 'Workflow triggered successfully';
        }
        
        console.log('N8N workflow triggered successfully:', responseData);
        
        // Send feedback to the webhook about successful trigger
        const sendFeedback = async (status: 'success' | 'completed' | 'error', message: string, data?: any) => {
          try {
            const feedbackResponse = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                feedback: true,
                status: status,
                message: message,
                timestamp: new Date().toISOString(),
                source: "CC_Benefit_Mapping_Button",
                originalTriggerData: {
                  action: "start_mapping",
                  timestamp: new Date().toISOString(),
                  source: "CC_Benefit_Mapping_Button"
                },
                additionalData: data
              })
            });
            
            console.log(`Feedback sent (${status}):`, message);
            return feedbackResponse.ok;
          } catch (error) {
            console.error('Failed to send feedback:', error);
            return false;
          }
        };
        
        // Send initial success feedback
        await sendFeedback('success', 'Workflow triggered successfully from UI', responseData);
        
        // Send periodic progress updates
        const progressInterval = setInterval(async () => {
          await sendFeedback('success', 'Workflow still processing...', {
            progressUpdate: true,
            timestamp: new Date().toISOString()
          });
        }, 15000); // Send progress update every 15 seconds
        
        alert(`✅ N8N Mapping Workflow Started Successfully!

🔗 Workflow URL: https://wecare.techconnect.co.id/workflow/p8GHylxULkDfEHIF

📋 The workflow will:
1. Clear existing CC benefit data
2. Read fresh data from Google Sheet  
3. Insert updated data into database
4. Process CC benefit mappings

⏱️ Processing time: Usually takes 30-60 seconds
📊 Data will refresh automatically in 5 seconds
📤 Feedback sent to webhook for tracking
📈 Progress updates will be sent every 15 seconds`);
        
        // Refresh the data after a delay to show updated results
        setTimeout(async () => {
          clearInterval(progressInterval); // Stop progress updates
          try {
            await fetchSheetData(true);
            // Send completion feedback after data refresh
            await sendFeedback('completed', 'Data refresh completed successfully', {
              refreshTime: new Date().toISOString(),
              dataCount: benefits.length,
              processingCompleted: true
            });
          } catch (error) {
            await sendFeedback('error', 'Data refresh failed', {
              error: error instanceof Error ? error.message : 'Unknown error',
              refreshTime: new Date().toISOString()
            });
          }
        }, 5000);
        
      } else {
        const errorText = await response.text();
        console.error('Webhook call failed:', response.status, errorText);
        throw new Error(`Webhook call failed with status ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.error('Error triggering N8N workflow:', error);
      
      // Send error feedback to webhook
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            feedback: true,
            status: 'error',
            message: 'Failed to trigger workflow from UI',
            timestamp: new Date().toISOString(),
            source: "CC_Benefit_Mapping_Button",
            error: error instanceof Error ? error.message : 'Unknown error',
            errorDetails: {
              stack: error instanceof Error ? error.stack : null,
              timestamp: new Date().toISOString()
            }
          })
        });
        console.log('Error feedback sent to webhook');
      } catch (feedbackError) {
        console.error('Failed to send error feedback:', feedbackError);
      }
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`❌ Failed to start N8N mapping workflow

🔍 Error Details: ${errorMessage}

🛠️ Troubleshooting:
1. Check if the n8n workflow is active
2. Verify the webhook URL is accessible
3. Check network connectivity
4. Ensure CORS is properly configured

🔗 Workflow URL: https://wecare.techconnect.co.id/workflow/p8GHylxULkDfEHIF
📤 Error feedback sent to webhook for debugging`);
    } finally {
      setIsMappingRunning(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      // Initial load with loading state
      fetchSheetData(true);
      
      // Auto-refresh data every 30 seconds (silent refresh)
      const interval = setInterval(() => fetchSheetData(false), 30000);
      
      return () => clearInterval(interval);
    }
  }, [router]);

  const fetchSheetData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
        setError(null);
        setUsingFallbackData(false);
      } else {
        setIsRefreshing(true);
      }
      
      // Updated sheet ID from the published web link
      const sheetId = "2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_";
      const tabId = "333075918"; // CC Benefit tab ID
      const rows = await fetchGoogleSheetData(sheetId, 'A:Z', tabId);
      
      if (isInitialLoad) {
        console.log('=== INITIAL LOAD ===');
        console.log('Raw rows from API:', rows?.length, 'rows');
        
        if (rows && rows.length > 0) {
          console.log('First row (headers):', rows[0]);
          console.log('Second row (first data):', rows[1]);
        }
      }
      
      const parsedData = parseCCBenefitData(rows);
      
      if (isInitialLoad) {
        console.log('Final parsed data length:', parsedData.length);
      }
      
      if (parsedData.length > 0) {
        if (isInitialLoad) {
          console.log('First parsed item:', parsedData[0]);
        }
        setBenefits(parsedData);
        if (isInitialLoad) {
          setError(null);
        }
      } else {
        if (isInitialLoad) {
          console.log('No parsed data found, using fallback data');
          setError("No data found in the Google Sheet. Please check if the sheet contains data or if the format is correct.");
          
          // Add test data to verify table rendering works
          const testData = [
            {
              id: "1",
              Company_Code: "TEST001",
              Benefit_Name: "Test Benefit",
              Description: "This is a test benefit from the parsed data",
              Category: "Testing",
              Status: "Active",
              Created_Date: "2024-01-01"
            },
            {
              id: "2",
              Company_Code: "GOLD001",
              Benefit_Name: "Gold Card Benefit",
              Description: "Premium benefits for gold card holders",
              Category: "Premium",
              Status: "Active",
              Created_Date: "2024-01-15"
            }
          ];
          console.log('Adding test data:', testData);
          setBenefits(testData);
        }
      }
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      if (isInitialLoad) {
        setError(error instanceof Error ? error.message : 'Failed to fetch sheet data');
        
        // Fallback to sample data if sheet fetch fails
        const fallbackData = [
          {
            id: "1",
            Company_Code: "Gold",
            Benefit_Name: "Cashback 2%",
            Description: "Cashback 2% untuk transaksi online",
            Category: "Reward",
            Status: "Active",
            Created_Date: "2024-01-15"
          },
          {
            id: "2",
            Company_Code: "Platinum",
            Benefit_Name: "Lounge Access",
            Description: "Akses lounge bandara internasional",
            Category: "Travel",
            Status: "Active",
            Created_Date: "2024-01-10"
          },
          {
            id: "3",
            Company_Code: "Silver",
            Benefit_Name: "Shopping Discount",
            Description: "Diskon 10% untuk belanja di merchant partner",
            Category: "Shopping",
            Status: "Active",
            Created_Date: "2024-01-20"
          }
        ];
        
        setBenefits(fallbackData);
        setUsingFallbackData(true);
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };



  const filteredBenefits = benefits.filter(benefit =>
    Object.entries(benefit).some(([key, value]) => {
      if (key === 'id' || key === '_originalRow' || key === '_headers') return false;
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  // Get all unique headers from the benefits data
  const getAllHeaders = () => {
    const headers = new Set<string>();
    benefits.forEach(benefit => {
      Object.keys(benefit).forEach(key => {
        if (!key.startsWith('_') && key !== 'id') {
          headers.add(key);
        }
      });
    });
    return Array.from(headers);
  };

  const allHeaders = getAllHeaders();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-primary font-medium text-sm sm:text-base">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4 sm:gap-0">
            <div className="flex items-center w-full sm:w-auto">
              <button
                onClick={() => router.push("/admin")}
                className="mr-3 sm:mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Data Mapping</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {usingFallbackData 
                    ? "Menggunakan data sample - Google Sheet tidak dapat diakses" 
                    : "Data real-time dari Google Spreadsheet - Auto-refresh otomatis setiap 30 detik"
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={triggerN8NMapping}
                disabled={isMappingRunning}
                className={`px-3 sm:px-4 py-2 text-white rounded-lg transition-colors duration-200 flex items-center justify-center text-sm sm:text-base ${
                  isMappingRunning 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isMappingRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="hidden sm:inline">Running Mapping...</span>
                    <span className="sm:hidden">Running...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="hidden sm:inline">Start Mapping CC Benefit</span>
                    <span className="sm:hidden">Start Mapping</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Tambah Data</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Warning: Google Sheet Access Issue
                </h3>
                <div className="mt-2 text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                  <p>{error}</p>
                  {usingFallbackData && (
                    <p className="mt-1">
                      <strong>Solution:</strong> Please ensure your Google Sheet is published to the web or check the sheet permissions. 
                      Currently showing sample data.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Debug Information */}
          <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">Debug Information:</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p><strong>Benefits count:</strong> {benefits.length}</p>
              <p><strong>Using fallback data:</strong> {usingFallbackData ? 'Yes' : 'No'}</p>
              {benefits.length > 0 && (
                <div className="mt-2">
                  <p><strong>First benefit structure:</strong></p>
                  <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(benefits[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari data..."
                  className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                Search across all columns
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table Header Info */}
          <div className="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Total Records: {filteredBenefits.length}
                </h3>
                {isRefreshing && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Refreshing...</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Scroll horizontally and vertically to view all data
              </div>
            </div>
          </div>
          <div className="data-table-container">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 compact-table">
              <thead>
                <tr>
                  {allHeaders.map((header) => (
                    <th key={header} className="text-left whitespace-nowrap text-xs sm:text-sm">
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th className="text-left whitespace-nowrap text-xs sm:text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBenefits.map((benefit) => (
                  <tr key={benefit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {allHeaders.map((header) => {
                      const cellValue = benefit[header] || '-';
                      
                      return (
                        <td key={header} className="text-gray-900 dark:text-white text-xs sm:text-sm">
                          <div className="table-cell-content" title={cellValue}>
                            {cellValue}
                          </div>
                        </td>
                      );
                    })}
                    <td className="font-medium whitespace-nowrap">
                      <div className="flex space-x-1">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-xs">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-xs">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredBenefits.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">Tidak ada data</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-1">Data akan muncul setelah berhasil mengambil dari Google Spreadsheet</p>
          </div>
        )}
      </div>
    </div>
  );
}
