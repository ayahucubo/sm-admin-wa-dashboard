"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import ChatMonitoringDashboard from "@/components/ChatMonitoringDashboard";
import FilterableChatHistoryTable from "@/components/FilterableChatHistoryTable";
import UniqueContactsChart from "@/components/UniqueContactsChart";
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
          <h2 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Dashboard Monitoring
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            Monitor aktivitas chat dan analisis data sistem. Gunakan menu navigasi di atas untuk mengakses fitur admin lainnya.
          </p>
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

        {/* Filterable Chat History Table */}
        <div className="mb-8">
          <FilterableChatHistoryTable />
        </div>


      </div>
    </AdminLayout>
  );
}
