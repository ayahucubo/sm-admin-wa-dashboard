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
  menuCounts: Record<string, number>;
  total: number;
}

// Props interface for the component
interface ChatMonitoringDashboardProps {
  chartData: DailyChatStats[];
  loading: boolean;
  error: string | null;
  onRefresh: (days?: number) => Promise<void>;
}

// Color palette for different menu categories (updated to match real database values)
const MENU_COLORS: Record<string, string> = {
  'Industrial Relation': '#3B82F6', // Blue
  'Jeanny': '#10B981', // Emerald
  'Benefit': '#F59E0B', // Amber
  'Peraturan Perusahaan': '#EF4444', // Red
  'Promosi': '#8B5CF6', // Violet
  'Cuti': '#EC4899', // Pink
  'Data Cuti': '#06B6D4', // Cyan
  'Unknown': '#6B7280', // Gray for unknown menus
};

// Time period options for flexible viewing
interface TimePeriodOption {
  label: string;
  value: string;
  days: number;
  description: string;
}

const TIME_PERIOD_OPTIONS: TimePeriodOption[] = [
  { label: 'Last 1 Day', value: 'daily-1', days: 1, description: 'Today only' },
  { label: 'Last 3 Days', value: 'daily-3', days: 3, description: 'Last 3 days' },
  { label: 'Last 7 Days', value: 'weekly-1', days: 7, description: 'This week' },
  { label: 'Last 14 Days', value: 'weekly-2', days: 14, description: 'Last 2 weeks' },
  { label: 'Last 30 Days', value: 'monthly-1', days: 30, description: 'This month' },
  { label: 'Last 60 Days', value: 'monthly-2', days: 60, description: 'Last 2 months' },
  { label: 'Last 90 Days', value: 'monthly-3', days: 90, description: 'Last 3 months' },
  { label: 'Last 180 Days', value: 'monthly-6', days: 180, description: 'Last 6 months' },
  { label: 'Last 365 Days', value: 'yearly-1', days: 365, description: 'This year' },
];

export default function ChatMonitoringDashboard({ 
  chartData, 
  loading, 
  error, 
  onRefresh 
}: ChatMonitoringDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly-1'); // Default to 30 days
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // Get current period details
  const currentPeriod = TIME_PERIOD_OPTIONS.find(p => p.value === selectedPeriod) || TIME_PERIOD_OPTIONS[4];
  
  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    const period = TIME_PERIOD_OPTIONS.find(p => p.value === newPeriod);
    if (period) {
      setSelectedPeriod(newPeriod);
      onRefresh(period.days);
    }
  };

  // Get all unique menu types from the data
  const allMenus = Array.from(
    new Set(
      chartData.flatMap(d => Object.keys(d.menuCounts))
    )
  ).sort();

  // Format date labels based on time period
  const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = currentPeriod.days;
    
    if (days <= 7) {
      // For daily/weekly views: show day and date
      return date.toLocaleDateString('id-ID', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short' 
      });
    } else if (days <= 60) {
      // For monthly views: show date and month
      return date.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short' 
      });
    } else if (days <= 180) {
      // For 3-6 month views: show month and year
      return date.toLocaleDateString('id-ID', { 
        month: 'short', 
        year: '2-digit' 
      });
    } else {
      // For yearly views: show month and year with week info
      return date.toLocaleDateString('id-ID', { 
        month: 'short', 
        year: '2-digit' 
      });
    }
  };

  // Prepare chart data using real database values
  const preparedChartData = {
    labels: chartData.map(d => formatDateLabel(d.date)),
    datasets: allMenus.map((menu) => ({
      label: menu,
      data: chartData.map(d => d.menuCounts[menu] || 0),
      backgroundColor: MENU_COLORS[menu] || MENU_COLORS['Unknown'],
      borderColor: MENU_COLORS[menu] || MENU_COLORS['Unknown'],
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
        text: `Daily Chat Volume by Menu Category (${currentPeriod.label})`,
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
            const date = chartData[index]?.date;
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
            const total = chartData[index]?.total || 0;
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
          maxRotation: currentPeriod.days > 30 ? 45 : 0, // Rotate labels for longer periods
          minRotation: 0,
          font: {
            size: currentPeriod.days > 180 ? 10 : 11, // Smaller font for very long periods
          },
          maxTicksLimit: currentPeriod.days > 90 ? 20 : undefined, // Limit ticks for long periods
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
              onClick={() => onRefresh(currentPeriod.days)}
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-secondary whitespace-nowrap">Time Period:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
              >
                <optgroup label="📅 Daily Views">
                  <option value="daily-1">Today (1 day)</option>
                  <option value="daily-3">Last 3 days</option>
                </optgroup>
                <optgroup label="📊 Weekly Views">
                  <option value="weekly-1">Last 7 days</option>
                  <option value="weekly-2">Last 14 days</option>
                </optgroup>
                <optgroup label="📈 Monthly Views">
                  <option value="monthly-1">Last 30 days</option>
                  <option value="monthly-2">Last 60 days</option>
                  <option value="monthly-3">Last 90 days</option>
                  <option value="monthly-6">Last 6 months</option>
                </optgroup>
                <optgroup label="📋 Yearly Views">
                  <option value="yearly-1">Last 365 days</option>
                </optgroup>
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                {currentPeriod.description}
              </span>
              <button
                onClick={() => onRefresh(currentPeriod.days)}
                disabled={loading}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Period Summary */}
      {chartData.length > 0 && !loading && (
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Viewing: {currentPeriod.label}
                </span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                📊 {chartData.length} data points • 📈 {allMenus.length} menu categories
              </div>
            </div>
            <div className="text-gray-500 dark:text-gray-500 text-xs">
              📅 {chartData.length > 0 ? `${new Date(chartData[0].date).toLocaleDateString('id-ID')} - ${new Date(chartData[chartData.length - 1].date).toLocaleDateString('id-ID')}` : ''}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-6">
        {chartData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">No Data Available</h3>
            <p className="text-muted">No chat statistics found for the selected period: {currentPeriod.label}</p>
          </div>
        ) : (
          <div className="h-80">
            <Bar ref={chartRef} data={preparedChartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {chartData.length > 0 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {chartData.reduce((sum: number, d: DailyChatStats) => sum + d.total, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted font-medium">Total Chats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(chartData.reduce((sum: number, d: DailyChatStats) => sum + d.total, 0) / chartData.length).toLocaleString()}
              </div>
              <div className="text-xs text-muted font-medium">Average per Day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.max(...chartData.map((d: DailyChatStats) => d.total)).toLocaleString()}
              </div>
              <div className="text-xs text-muted font-medium">Peak Day Volume</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}