'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { exportToExcel, formatFeedbackDetailsForExcel } from '@/utils/excelExport';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Interface definitions
interface DailyRatingStats {
  date: string;
  ratings: {
    rating1: number;
    rating2: number;
    rating3: number;
    rating4: number;
    rating5: number;
  };
  totalFeedback: number;
  averageRating: number;
}

interface RatingSummary {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: {
    rating1: number;
    rating2: number;
    rating3: number;
    rating4: number;
    rating5: number;
  };
}

interface FeedbackRatingData {
  success: boolean;
  data: DailyRatingStats[];
  summary: RatingSummary;
  period: {
    days: number;
    startDate: string | null;
    endDate: string | null;
  };
  error?: string;
}

interface FeedbackDetailItem {
  id: number;
  userId: string;
  chatName: string;
  feedbackRating: number;
  feedbackReason: string;
  feedbackDate: string;
  companyCode: string;
}

interface FeedbackDetailsResponse {
  success: boolean;
  data: FeedbackDetailItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// Color palette for different ratings
const RATING_COLORS = {
  rating1: '#EF4444', // Red - Very Poor
  rating2: '#F97316', // Orange - Poor
  rating3: '#EAB308', // Yellow - Average
  rating4: '#22C55E', // Green - Good
  rating5: '#3B82F6', // Blue - Excellent
};

// Rating labels
const RATING_LABELS = {
  rating1: '⭐ 1 - Very Poor',
  rating2: '⭐⭐ 2 - Poor',
  rating3: '⭐⭐⭐ 3 - Average',
  rating4: '⭐⭐⭐⭐ 4 - Good',
  rating5: '⭐⭐⭐⭐⭐ 5 - Excellent',
};

// Time period options for filtering
const TIME_PERIOD_OPTIONS = [
  { label: '1 Day', value: 1 },
  { label: '3 Days', value: 3 },
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
  { label: '60 Days', value: 60 },
  { label: '90 Days', value: 90 },
  { label: '180 Days', value: 180 },
  { label: '365 Days', value: 365 },
];

const FeedbackRatingChart: React.FC = () => {
  const [chartData, setChartData] = useState<DailyRatingStats[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState(30);
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // State for feedback details table
  const [feedbackDetails, setFeedbackDetails] = useState<FeedbackDetailItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsPage, setDetailsPage] = useState(1);
  const [detailsTotalPages, setDetailsTotalPages] = useState(1);
  const [detailsTotal, setDetailsTotal] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const detailsLimit = 10;

  // Get API path based on environment
  const getApiPath = () => {
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    return isProduction ? '/sm-admin/api/monitoring/feedback-rating' : '/api/monitoring/feedback-rating';
  };

  // Fetch feedback rating data
  const fetchFeedbackRatingData = async (days: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching feedback rating data for ${days} days`);
      
      const apiPath = getApiPath();
      
      console.log('Environment detection:', { 
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
        apiPath 
      });
      
      const response = await authenticatedFetch(`${apiPath}?days=${days}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FeedbackRatingData = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch feedback rating data');
      }
      
      setChartData(data.data);
      setSummary(data.summary);
      console.log(`Loaded ${data.data.length} days of feedback rating data`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feedback rating data';
      console.error('Error fetching feedback rating data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch feedback details for table
  const fetchFeedbackDetails = async (page: number = 1, resetPage: boolean = false) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      
      const apiPath = getApiPath();
      const params = new URLSearchParams({
        type: 'details',
        page: page.toString(),
        limit: detailsLimit.toString()
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await authenticatedFetch(`${apiPath}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FeedbackDetailsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch feedback details');
      }
      
      setFeedbackDetails(data.data);
      setDetailsPage(data.pagination.page);
      setDetailsTotalPages(data.pagination.totalPages);
      setDetailsTotal(data.pagination.total);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feedback details';
      console.error('Error fetching feedback details:', err);
      setDetailsError(errorMessage);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Export feedback details to Excel
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      
      const apiPath = getApiPath();
      const params = new URLSearchParams({
        type: 'details',
        page: '1',
        limit: '10000' // Get all data for export
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await authenticatedFetch(`${apiPath}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FeedbackDetailsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch data for export');
      }
      
      const formattedData = formatFeedbackDetailsForExcel(data.data);
      const dateRange = startDate && endDate 
        ? `_${startDate}_to_${endDate}` 
        : `_${new Date().toISOString().split('T')[0]}`;
      
      exportToExcel(formattedData, `Feedback_Rating_Details${dateRange}`);
      
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Handle date filter
  const handleFilterApply = () => {
    setDetailsPage(1);
    fetchFeedbackDetails(1, true);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setStartDate('');
    setEndDate('');
    setDetailsPage(1);
    fetchFeedbackDetails(1, true);
  };

  // Initial fetch
  useEffect(() => {
    fetchFeedbackRatingData(timePeriod);
    fetchFeedbackDetails(1);
  }, []);

  // Handle time period change
  const handleTimePeriodChange = (days: number) => {
    setTimePeriod(days);
    fetchFeedbackRatingData(days);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit',
      month: 'short'
    });
  };

  // Prepare chart data
  const prepareChartData = () => {
    const labels = chartData.map(item => formatDate(item.date));
    
    return {
      labels,
      datasets: [
        {
          label: '⭐ 1',
          data: chartData.map(item => item.ratings.rating1),
          backgroundColor: RATING_COLORS.rating1,
          borderColor: RATING_COLORS.rating1,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: '⭐⭐ 2',
          data: chartData.map(item => item.ratings.rating2),
          backgroundColor: RATING_COLORS.rating2,
          borderColor: RATING_COLORS.rating2,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: '⭐⭐⭐ 3',
          data: chartData.map(item => item.ratings.rating3),
          backgroundColor: RATING_COLORS.rating3,
          borderColor: RATING_COLORS.rating3,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: '⭐⭐⭐⭐ 4',
          data: chartData.map(item => item.ratings.rating4),
          backgroundColor: RATING_COLORS.rating4,
          borderColor: RATING_COLORS.rating4,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: '⭐⭐⭐⭐⭐ 5',
          data: chartData.map(item => item.ratings.rating5),
          backgroundColor: RATING_COLORS.rating5,
          borderColor: RATING_COLORS.rating5,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (items: TooltipItem<'bar'>[]) => {
            const index = items[0]?.dataIndex;
            if (index !== undefined && chartData[index]) {
              const item = chartData[index];
              return `${new Date(item.date).toLocaleDateString('id-ID', { 
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}`;
            }
            return '';
          },
          afterBody: (items: TooltipItem<'bar'>[]) => {
            const index = items[0]?.dataIndex;
            if (index !== undefined && chartData[index]) {
              const item = chartData[index];
              return [
                '',
                `Total Feedback: ${item.totalFeedback}`,
                `Average Rating: ${item.averageRating.toFixed(2)} ⭐`,
              ];
            }
            return [];
          },
        },
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
            size: 10,
          },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: 'Number of Feedbacks',
          font: {
            size: 12,
          },
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div className="rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-xl">⭐</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Feedback Rating Monitoring
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                User satisfaction ratings distribution
              </p>
            </div>
          </div>
          
          {/* Time Period Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Period:
            </label>
            <select
              value={timePeriod}
              onChange={(e) => handleTimePeriodChange(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              {TIME_PERIOD_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => fetchFeedbackRatingData(timePeriod)}
              disabled={loading}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-muted)' }}>Loading feedback data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">Failed to load data</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
              <button
                onClick={() => fetchFeedbackRatingData(timePeriod)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Stats and Distribution Section */}
            {summary && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Left: Key Metrics */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-3">
                  {/* Total Feedback */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Total Feedback</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {summary.totalFeedback.toLocaleString()}
                    </p>
                  </div>

                  {/* Average Rating */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 border border-yellow-200 dark:border-yellow-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <span className="text-sm">⭐</span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Avg Rating</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {summary.averageRating.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Right: Rating Distribution */}
                <div className="lg:col-span-2 p-4 rounded-xl border shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                  <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Rating Distribution
                  </h4>
                  
                  {summary.totalFeedback > 0 ? (
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = summary.ratingDistribution[`rating${rating}` as keyof typeof summary.ratingDistribution];
                        const percentage = (count / summary.totalFeedback) * 100;
                        const color = RATING_COLORS[`rating${rating}` as keyof typeof RATING_COLORS];
                        
                        return (
                          <div key={rating} className="flex items-center gap-3">
                            <div className="w-12 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {rating} ⭐
                            </div>
                            <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                              <div
                                className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                style={{ 
                                  width: `${Math.max(percentage, 0)}%`,
                                  backgroundColor: color,
                                  minWidth: count > 0 ? '24px' : '0'
                                }}
                              >
                                {percentage >= 10 && (
                                  <span className="text-xs font-medium text-white">{count}</span>
                                )}
                              </div>
                            </div>
                            <div className="w-16 text-right">
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{count}</span>
                              <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>({percentage.toFixed(0)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No ratings available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bar Chart Section */}
            <div className="rounded-xl border p-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Daily Rating Trends
              </h4>
              <div className="h-72">
                {chartData.length > 0 ? (
                  <Bar ref={chartRef} data={prepareChartData()} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>No feedback data available</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        No ratings have been recorded for this period
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Details Table Section */}
            <div className="mt-6 rounded-xl border shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              {/* Table Header with Filters */}
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Feedback Details
                    </h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {detailsTotal > 0 ? `${detailsTotal.toLocaleString()} total feedback entries` : 'No feedback data'}
                    </p>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>From:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ 
                          backgroundColor: 'var(--input-bg)', 
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>To:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ 
                          backgroundColor: 'var(--input-bg)', 
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    <button
                      onClick={handleFilterApply}
                      disabled={detailsLoading}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Apply
                    </button>
                    <button
                      onClick={handleFilterReset}
                      disabled={detailsLoading}
                      className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleExportExcel}
                      disabled={exporting || detailsTotal === 0}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {exporting ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export Excel
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                {detailsLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading feedback details...</p>
                    </div>
                  </div>
                ) : detailsError ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <p className="text-red-600 dark:text-red-400 text-sm mb-2">{detailsError}</p>
                      <button
                        onClick={() => fetchFeedbackDetails(detailsPage)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : feedbackDetails.length === 0 ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No feedback entries found</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your date filter</p>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>No</th>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Name</th>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Phone Number</th>
                        <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--text-primary)' }}>Rating</th>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Reason</th>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Date</th>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Company</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackDetails.map((item, index) => (
                        <tr 
                          key={`${item.userId}-${item.feedbackDate}-${index}`} 
                          className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          style={{ borderColor: 'var(--border-color)' }}
                        >
                          <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                            {(detailsPage - 1) * detailsLimit + index + 1}
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                            {item.chatName || 'Unknown'}
                          </td>
                          <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                            {item.userId || '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${RATING_COLORS[`rating${item.feedbackRating}` as keyof typeof RATING_COLORS]}20`,
                                color: RATING_COLORS[`rating${item.feedbackRating}` as keyof typeof RATING_COLORS]
                              }}
                            >
                              {'⭐'.repeat(item.feedbackRating || 0)} {item.feedbackRating}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }} title={item.feedbackReason}>
                            {item.feedbackReason || '-'}
                          </td>
                          <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                            {item.feedbackDate 
                              ? new Date(item.feedbackDate).toLocaleDateString('id-ID', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })
                              : '-'
                            }
                          </td>
                          <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                            {item.companyCode || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {detailsTotalPages > 1 && (
                <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Page {detailsPage} of {detailsTotalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchFeedbackDetails(detailsPage - 1)}
                      disabled={detailsPage <= 1 || detailsLoading}
                      className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchFeedbackDetails(detailsPage + 1)}
                      disabled={detailsPage >= detailsTotalPages || detailsLoading}
                      className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackRatingChart;
