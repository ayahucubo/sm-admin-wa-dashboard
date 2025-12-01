"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import ChatMonitoringDashboard from "@/components/ChatMonitoringDashboard";
import FilterableChatHistoryTable from "@/components/FilterableChatHistoryTable";
import UniqueContactsChart from "@/components/UniqueContactsChart";
import CompanyContactChart from "@/components/CompanyContactChart";
import DatabaseStorageMonitor from "@/components/DatabaseStorageMonitor";
import FeedbackRatingChart from "@/components/FeedbackRatingChart";
import localApi from "@/utils/localApi";

// Interface for chat history item
interface ChatHistoryItem {
  executionId: string;
  startedAt: string;
  contact: string;
  chat: string;
  chatResponse: string;
  currentMenu: string;
  workflowId: string;
  workflowName: string;
  date: string;
}

// Interface for aggregated chart data
interface DailyChatStats {
  date: string;
  menuCounts: Record<string, number>;
  total: number;
}



export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Shared state for chat data
  const [chartData, setChartData] = useState<DailyChatStats[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Fetch comprehensive chat history data for both chart and table
  const fetchChatData = async (days: number = 30) => {
    setDataLoading(true);
    setDataError(null);
    
    try {
      // Calculate date range for the last N days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Fetch all chat history data without pagination for comprehensive chart data
      const params = new URLSearchParams({
        startDate: startDateStr,
        endDate: endDate,
        limit: '10000', // Large limit to get all data for aggregation
        page: '1'
      });
      
      console.log(`Fetching chat data for chart aggregation (${days} days)`);
      const response = await localApi.get(`/api/chat/history-filtered?${params.toString()}`);
      
      if (response.data.success) {
        const rawData: ChatHistoryItem[] = response.data.data;
        
        // Process data for chart visualization
        const aggregatedData = aggregateDataForChart(rawData, days);
        setChartData(aggregatedData);
        
        console.log(`Processed ${rawData.length} chat records into ${aggregatedData.length} daily aggregations`);
      } else {
        throw new Error('Failed to fetch chat data');
      }
    } catch (err) {
      console.error('Error fetching chat data:', err);
      setDataError(err instanceof Error ? err.message : 'Failed to load chat data');
      setChartData([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Process raw chat history into daily aggregated data for charts
  const aggregateDataForChart = (rawData: ChatHistoryItem[], days: number): DailyChatStats[] => {
    // Create a map to hold daily stats
    const dailyStatsMap = new Map<string, Record<string, number>>();
    
    // Initialize all days in the range with zero counts
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStatsMap.set(dateStr, {});
    }
    
    // Process each chat record
    rawData.forEach(item => {
      const dateStr = new Date(item.startedAt).toISOString().split('T')[0];
      const menu = item.currentMenu || 'Unknown';
      
      // Only include data within our date range
      if (dailyStatsMap.has(dateStr)) {
        const dayStats = dailyStatsMap.get(dateStr)!;
        dayStats[menu] = (dayStats[menu] || 0) + 1;
      }
    });

    // Convert map to array format expected by chart
    const result: DailyChatStats[] = [];
    dailyStatsMap.forEach((menuCounts, date) => {
      const total = Object.values(menuCounts).reduce((sum, count) => sum + count, 0);
      result.push({
        date,
        menuCounts,
        total
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  };

  // Handle comprehensive export with authentication
  const handleComprehensiveExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to export data');
        return;
      }

      // Detect environment for correct API path
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.startsWith('192.168.');
      
      const apiPath = isLocalhost 
        ? '/api/export/comprehensive?days=30'
        : '/sm-admin/api/export/comprehensive?days=30';

      console.log('Exporting comprehensive data from:', apiPath);

      const response = await fetch(apiPath, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      // Get the filename from response headers or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'WA_Admin_Dashboard_Export.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Convert response to blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('Comprehensive export completed successfully');
    } catch (error) {
      console.error('Error exporting comprehensive data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setLoading(false);
      // Fetch data on component mount
      fetchChatData(30); // Default to 30 days
    }
  }, [router]);





  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-primary font-medium">Memuat menu admin...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Admin Panel" subtitle="Kelola sistem dan database">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Dashboard Monitoring
              </h2>
              <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
                Monitor aktivitas chat dan analisis data sistem. Gunakan menu navigasi di atas untuk mengakses fitur admin lainnya.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleComprehensiveExport}
                disabled={dataLoading}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                title="Export semua data monitoring ke Excel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Export All Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Rating Monitoring */}
        <div className="mb-8">
          <FeedbackRatingChart />
        </div>

        {/* Chat Monitoring Dashboard */}
        <div className="mb-8">
          <ChatMonitoringDashboard 
            chartData={chartData}
            loading={dataLoading}
            error={dataError}
            onRefresh={fetchChatData}
          />
        </div>

        {/* Unique Contacts Chart */}
        <div className="mb-8">
          <UniqueContactsChart />
        </div>

        {/* Company Contact Chart */}
        <div className="mb-8">
          <CompanyContactChart />
        </div>

        {/* Database Storage Monitor */}
        <div className="mb-8">
          <DatabaseStorageMonitor />
        </div>

        {/* Filterable Chat History Table */}
        <div className="mb-8">
          <FilterableChatHistoryTable />
        </div>


      </div>
    </AdminLayout>
  );
}
