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
import { exportToExcel } from '@/utils/excelExport';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Interface for company contact stats
interface CompanyContactStats {
  companyCode: string;
  companyName: string;
  uniqueContacts: number;
  phoneNumbers: string[];
  lastContact: string;
}

// Interface for API response
interface CompanyContactsResponse {
  success: boolean;
  data: CompanyContactStats[];
  summary: {
    totalCompanies: number;
    totalUniqueContacts: number;
    dataGeneratedAt: string;
  };
  error?: string;
}

// Time period options
interface TimePeriodOption {
  label: string;
  value: string;
  days: number;
  description: string;
}

const TIME_PERIOD_OPTIONS: TimePeriodOption[] = [
  { label: 'Last 7 Days', value: 'weekly-1', days: 7, description: 'This week' },
  { label: 'Last 14 Days', value: 'weekly-2', days: 14, description: 'Last 2 weeks' },
  { label: 'Last 30 Days', value: 'monthly-1', days: 30, description: 'This month' },
  { label: 'Last 60 Days', value: 'monthly-2', days: 60, description: 'Last 2 months' },
  { label: 'Last 90 Days', value: 'monthly-3', days: 90, description: 'Last 3 months' },
  { label: 'Last 180 Days', value: 'monthly-6', days: 180, description: 'Last 6 months' },
];

// Color palette for company bars
const COMPANY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'
];

export default function CompanyContactChart() {
  const [companyData, setCompanyData] = useState<CompanyContactStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly-1'); // Default to 30 days
  const [summary, setSummary] = useState({
    totalCompanies: 0,
    totalUniqueContacts: 0,
    dataGeneratedAt: ''
  });
  
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // Get current period details
  const currentPeriod = TIME_PERIOD_OPTIONS.find(p => p.value === selectedPeriod) || TIME_PERIOD_OPTIONS[2];

  // Fetch company contact data
  const fetchCompanyContactData = async (days: number = 30) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching company contact data for ${days} days`);
      
      const params = new URLSearchParams({
        days: days.toString(),
        includePhoneNumbers: 'false' // We don't need phone numbers for the chart
      });
      
      // Use a longer timeout for this specific API call since it processes SAP data
      const response = await localApi.get(`/api/monitoring/company-contacts?${params.toString()}`, {
        timeout: 60000 // 60 seconds timeout for company contact data
      });
      const data: CompanyContactsResponse = response.data;
      
      if (data.success) {
        // Limit to top 15 companies for better chart readability
        const topCompanies = data.data.slice(0, 15);
        setCompanyData(topCompanies);
        setSummary(data.summary);
        
        console.log(`Company contact data loaded: ${topCompanies.length} companies (showing top 15)`);
      } else {
        throw new Error(data.error || 'Failed to fetch company contact data');
      }
    } catch (err) {
      console.error('Error fetching company contact data:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load company contact data';
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. The system is processing a large amount of data. Please try again with a shorter time period.';
        } else if (err.message.includes('Network Error')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setCompanyData([]);
      setSummary({
        totalCompanies: 0,
        totalUniqueContacts: 0,
        dataGeneratedAt: ''
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    const period = TIME_PERIOD_OPTIONS.find(p => p.value === newPeriod);
    if (period) {
      setSelectedPeriod(newPeriod);
      fetchCompanyContactData(period.days);
    }
  };

  // Handle Excel export
  const handleExportExcel = async () => {
    if (companyData.length === 0) {
      alert('No data available to export');
      return;
    }

    try {
      // Fetch full data with phone numbers for export
      const params = new URLSearchParams({
        days: currentPeriod.days.toString(),
        includePhoneNumbers: 'true'
      });
      
      const response = await localApi.get(`/api/monitoring/company-contacts?${params.toString()}`, {
        timeout: 60000 // 60 seconds timeout for export with full data
      });
      const fullData: CompanyContactsResponse = response.data;
      
      if (fullData.success) {
        // Format data for Excel
        const excelData = fullData.data.map((company, index) => ({
          'No': index + 1,
          'Company Code': company.companyCode,
          'Company Name': company.companyName,
          'Unique Contacts': company.uniqueContacts,
          'Phone Numbers': company.phoneNumbers.join(', '),
          'Last Contact': new Date(company.lastContact).toLocaleString('id-ID')
        }));
        
        const filename = `Company_Contact_Stats_${currentPeriod.label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
        
        const success = exportToExcel(excelData, filename, 'Company Contact Statistics');
        if (success) {
          console.log('Company contact data exported to Excel successfully');
        } else {
          alert('Failed to export data to Excel');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data to Excel');
    }
  };

  // Initial load
  useEffect(() => {
    fetchCompanyContactData(currentPeriod.days);
  }, []);

  // Prepare chart data
  const chartData = {
    labels: companyData.map(company => {
      // Truncate long company names for better display
      const displayName = company.companyName.length > 25 
        ? company.companyName.substring(0, 25) + '...'
        : company.companyName;
      return `${company.companyCode}\n${displayName}`;
    }),
    datasets: [
      {
        label: 'Unique Contacts',
        data: companyData.map(company => company.uniqueContacts),
        backgroundColor: companyData.map((_, index) => 
          COMPANY_COLORS[index % COMPANY_COLORS.length]
        ),
        borderColor: companyData.map((_, index) => 
          COMPANY_COLORS[index % COMPANY_COLORS.length]
        ),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Contact Count by Company (${currentPeriod.label})`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      },
      legend: {
        display: false, // Hide legend since we have colors for each bar
      },
      tooltip: {
        callbacks: {
          title: (context: TooltipItem<'bar'>[]) => {
            const index = context[0].dataIndex;
            const company = companyData[index];
            return `${company.companyCode} - ${company.companyName}`;
          },
          label: (context: TooltipItem<'bar'>) => {
            const index = context.dataIndex;
            const company = companyData[index];
            return [
              `Unique Contacts: ${company.uniqueContacts}`,
              `Last Contact: ${new Date(company.lastContact).toLocaleDateString('id-ID')}`
            ];
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Company (Code - Name)',
          font: {
            size: 12,
            weight: 'bold' as const,
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10
          }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Unique Contacts',
          font: {
            size: 12,
            weight: 'bold' as const,
          }
        },
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            return Number.isInteger(value) ? value : '';
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Loading company contact data...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              This may take up to 60 seconds as we fetch company information from SAP
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Failed to Load Data</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => fetchCompanyContactData(currentPeriod.days)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Contact Count by Company
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Number of unique contacts per company based on chat history ({summary.totalCompanies} companies, {summary.totalUniqueContacts} total contacts)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TIME_PERIOD_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* Export Button */}
            <button
              onClick={handleExportExcel}
              disabled={loading || companyData.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              title="Export to Excel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={() => fetchCompanyContactData(currentPeriod.days)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              title="Refresh Data"
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
        {companyData.length > 0 ? (
          <div style={{ height: '400px' }}>
            <Bar ref={chartRef} data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Company Data Available</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No company contact data found for the selected time period.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Company Details Table */}
      {companyData.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              Company Details (Top {companyData.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Company Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Company Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unique Contacts
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Contact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {companyData.map((company, index) => (
                    <tr key={`${company.companyCode}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: COMPANY_COLORS[index % COMPANY_COLORS.length] }}
                          ></div>
                          {company.companyCode}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {company.companyName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {company.uniqueContacts} contacts
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(company.lastContact).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}