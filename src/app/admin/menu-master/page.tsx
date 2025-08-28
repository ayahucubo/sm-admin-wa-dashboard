"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchGoogleSheetData, parseCCBenefitData } from "@/utils/sheets";

interface MenuMaster {
  id: string;
  menuName?: string;
  menuCode?: string;
  description?: string;
  parentMenu?: string;
  menuOrder?: number;
  icon?: string;
  route?: string;
  isActive?: boolean;
  permissions?: string[];
  createdAt?: string;
  [key: string]: any; // Allow dynamic property access
}

export default function MenuMasterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<MenuMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      
      // Updated sheet ID from the published web link for Menu Master
      const sheetId = "2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_";
      const tabId = "2112688959"; // Menu Master tab ID
      const rows = await fetchGoogleSheetData(sheetId, 'A:Z', tabId);
      
      if (isInitialLoad) {
        console.log('=== MENU MASTER INITIAL LOAD ===');
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
        setMenus(parsedData);
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
              menuName: "Dashboard",
              menuCode: "DASHBOARD",
              description: "Halaman utama dashboard",
              parentMenu: "Main",
              menuOrder: 1,
              icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
              route: "/dashboard",
              isActive: true,
              permissions: ["read"],
              createdAt: "2024-01-15"
            },
            {
              id: "2",
              menuName: "Mapping CC Benefit",
              menuCode: "CC_BENEFIT",
              description: "Kelola mapping credit card benefit",
              parentMenu: "Admin",
              menuOrder: 2,
              icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
              route: "/admin/mapping-cc-benefit",
              isActive: true,
              permissions: ["read", "write"],
              createdAt: "2024-01-10"
            }
          ];
          console.log('Adding test data:', testData);
          setMenus(testData);
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
            menuName: "Dashboard",
            menuCode: "DASHBOARD",
            description: "Halaman utama dashboard",
            parentMenu: "Main",
            menuOrder: 1,
            icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
            route: "/dashboard",
            isActive: true,
            permissions: ["read"],
            createdAt: "2024-01-15"
          },
          {
            id: "2",
            menuName: "Mapping CC Benefit",
            menuCode: "CC_BENEFIT",
            description: "Kelola mapping credit card benefit",
            parentMenu: "Admin",
            menuOrder: 2,
            icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
            route: "/admin/mapping-cc-benefit",
            isActive: true,
            permissions: ["read", "write"],
            createdAt: "2024-01-10"
          },
          {
            id: "3",
            menuName: "Mapping CC PP",
            menuCode: "CC_PP",
            description: "Kelola mapping credit card payment plan",
            parentMenu: "Admin",
            menuOrder: 3,
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            route: "/admin/mapping-cc-pp",
            isActive: true,
            permissions: ["read", "write"],
            createdAt: "2024-01-10"
          }
        ];
        
        setMenus(fallbackData);
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

  const filteredMenus = menus.filter(menu =>
    Object.entries(menu).some(([key, value]) => {
      if (key === 'id' || key === '_originalRow' || key === '_headers') return false;
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  // Get all unique headers from the menus data
  const getAllHeaders = () => {
    const headers = new Set<string>();
    menus.forEach(menu => {
      Object.keys(menu).forEach(key => {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-primary font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/admin")}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Mapping Menu Master</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {usingFallbackData 
                    ? "Menggunakan data sample - Google Sheet tidak dapat diakses" 
                    : "Data real-time dari Google Spreadsheet - Auto-refresh otomatis setiap 30 detik"
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Start master menu functionality
                  console.log('Starting Master Menu process...');
                  // You can add your mapping logic here
                  alert('Starting Master Menu process...');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Master Menu
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Warning: Google Sheet Access Issue
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
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
          <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Debug Information:</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p><strong>Menus count:</strong> {menus.length}</p>
              <p><strong>Using fallback data:</strong> {usingFallbackData ? 'Yes' : 'No'}</p>
              {menus.length > 0 && (
                <div className="mt-2">
                  <p><strong>First menu structure:</strong></p>
                  <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(menus[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {/*<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>*/}
                </div>
                <input
                  type="text"
                  placeholder="Cari data..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Total Records: {filteredMenus.length}
                </h3>
                {isRefreshing && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                    <div className="w-3 h-3 border border-orange-600 border-t-transparent rounded-full animate-spin"></div>
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
                    <th key={header} className="text-left whitespace-nowrap">
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th className="text-left whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMenus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {allHeaders.map((header) => {
                      const cellValue = menu[header] || '-';
                      
                      return (
                        <td key={header} className="text-gray-900 dark:text-white">
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
        {filteredMenus.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Tidak ada data</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Data akan muncul setelah berhasil mengambil dari Google Spreadsheet</p>
          </div>
        )}
      </div>
    </div>
  );
}
