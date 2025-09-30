"use client";
import React, { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import localApi from '@/utils/localApi';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DailyChatStats {
  date: string;
  menuCounts: {
    'industrial relation': number;
    'jenny': number;
    'benefit': number;
    'company regulations': number;
    'promotion': number;
    'leave': number;
  };
  total: number;
}

interface ChatStatsResponse {
  success: boolean;
  data: DailyChatStats[];
  period: {
    days: number;
    startDate: string | null;
    endDate: string | null;
  };
  menuTypes: string[];
}

// Color palette for different menu categories
const MENU_COLORS = {
  'industrial relation': '#3B82F6', // Blue
  'jenny': '#10B981', // Emerald
  'benefit': '#F59E0B', // Amber
  'company regulations': '#EF4444', // Red
  'promotion': '#8B5CF6', // Violet
  'leave': '#EC4899', // Pink
};

export default function ChatMonitoringDashboard() {
  const [data, setData] = useState<DailyChatStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(14); // Default to 14 days for better visibility
  const chartRef = useRef<ChartJS<'bar'>>(null);

  useEffect(() => {
    fetchChatStats();
  }, [days]);

  const fetchChatStats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching chat statistics for ${days} days`);
      const response = await localApi.get(`/api/monitoring/chat-stats?days=${days}`);
      const result: ChatStatsResponse = response.data;
      
      if (result.success) {
        setData(result.data);
        console.log(`Successfully loaded ${result.data.length} days of statistics`);
      } else {
        throw new Error('Failed to fetch chat statistics');
      }
    } catch (err) {
      console.error('Error fetching chat statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short' 
    })),
    datasets: Object.keys(MENU_COLORS).map((menu) => ({
      label: menu.charAt(0).toUpperCase() + menu.slice(1), // Capitalize first letter
      data: data.map(d => d.menuCounts[menu as keyof typeof MENU_COLORS] || 0),
      backgroundColor: MENU_COLORS[menu as keyof typeof MENU_COLORS],
      borderColor: MENU_COLORS[menu as keyof typeof MENU_COLORS],
      borderWidth: 1,
    }))
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `Daily Chat Volume by Menu Category (Last ${days} Days)`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          title: (context: TooltipItem<'bar'>[]) => {
            const index = context[0].dataIndex;
            const date = data[index]?.date;
            return date ? new Date(date).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            }) : '';
          },
          label: (context: TooltipItem<'bar'>) => {
            const menuName = context.dataset.label;
            const count = context.parsed.y;
            return `${menuName}: ${count} chat${count !== 1 ? 's' : ''}`;
          },
          footer: (context: TooltipItem<'bar'>[]) => {
            const index = context[0].dataIndex;
            const total = data[index]?.total || 0;
            return `Total: ${total} chat${total !== 1 ? 's' : ''}`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        footerColor: '#fff',
        cornerRadius: 8,
        bodySpacing: 4,
        footerSpacing: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11,
          },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 2,
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-secondary text-sm">Loading chat monitoring data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center h-80 flex items-center justify-center">
          <div className="max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Failed to Load Data</h3>
            <p className="text-sm text-muted mb-4">{error}</p>
            <button
              onClick={fetchChatStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header with controls */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-primary">Chat Volume Monitoring</h3>
            <p className="text-sm text-muted mt-1">Daily incoming chat analysis by menu category</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-secondary">Time Period:</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <button
              onClick={fetchChatStats}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {data.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">No Data Available</h3>
            <p className="text-muted">No chat statistics found for the selected period</p>
          </div>
        ) : (
          <div className="h-80">
            <Bar ref={chartRef} data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {data.length > 0 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {data.reduce((sum, d) => sum + d.total, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted font-medium">Total Chats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(data.reduce((sum, d) => sum + d.total, 0) / data.length).toLocaleString()}
              </div>
              <div className="text-xs text-muted font-medium">Average per Day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.max(...data.map(d => d.total)).toLocaleString()}
              </div>
              <div className="text-xs text-muted font-medium">Peak Day Volume</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}