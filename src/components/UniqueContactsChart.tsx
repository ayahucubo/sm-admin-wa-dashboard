'use client';

import React, { useState, useEffect } from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Interface definitions
interface DailyUniqueContactsStats {
  date: string;
  uniqueContacts: number;
}

interface ContactDetail {
  contactId: string;
  contactName: string;
  chatCount: number;
}

interface UniqueContactsData {
  success: boolean;
  data: DailyUniqueContactsStats[];
  period: {
    days: number;
    startDate: string | null;
    endDate: string | null;
  };
  error?: string;
}

interface ContactDetailsData {
  success: boolean;
  date: string;
  contacts: ContactDetail[];
  total: number;
}

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

const UniqueContactsChart: React.FC = () => {
  const [chartData, setChartData] = useState<DailyUniqueContactsStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState(30);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [contactDetails, setContactDetails] = useState<ContactDetail[]>([]);
  const [contactDetailsLoading, setContactDetailsLoading] = useState(false);

  // Fetch unique contacts data
  const fetchUniqueContactsData = async (days: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching unique contacts data for ${days} days`);
      
      // Use correct API path based on environment
      const apiPath = process.env.NODE_ENV === 'production' ? '/sm-admin/api/monitoring/unique-contacts' : '/api/monitoring/unique-contacts';
      const response = await authenticatedFetch(`${apiPath}?days=${days}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: UniqueContactsData = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch unique contacts data');
      }
      
      setChartData(data.data);
      console.log(`Loaded ${data.data.length} days of unique contacts data`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load unique contacts data';
      console.error('Error fetching unique contacts data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contact details for a specific date
  const fetchContactDetails = async (date: string) => {
    try {
      setContactDetailsLoading(true);
      
      console.log(`Fetching contact details for date: ${date}`);
      
      // Use correct API path based on environment
      const apiPath = process.env.NODE_ENV === 'production' ? '/sm-admin/api/monitoring/unique-contacts' : '/api/monitoring/unique-contacts';
      const response = await authenticatedFetch(`${apiPath}?date=${date}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ContactDetailsData = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch contact details');
      }
      
      setContactDetails(data.contacts);
      setSelectedDate(date);
      setShowContactDetails(true);
      
      console.log(`Loaded ${data.contacts.length} contacts for ${date}`);
      
    } catch (err) {
      console.error('Error fetching contact details:', err);
      alert('Failed to load contact details. Please try again.');
    } finally {
      setContactDetailsLoading(false);
    }
  };

  // Load data on component mount and when time period changes
  useEffect(() => {
    fetchUniqueContactsData(timePeriod);
  }, [timePeriod]);

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (timePeriod <= 7) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
    } else if (timePeriod <= 30) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Prepare chart data
  const chartConfig = {
    labels: chartData.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Unique Contacts',
        data: chartData.map(item => item.uniqueContacts),
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // Green color
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  // Chart options with click handler
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Unique Contacts (Last ${timePeriod} days)`,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            const value = context.parsed.y;
            return `${value} unique contact${value !== 1 ? 's' : ''}`;
          },
          afterLabel: function() {
            return 'Click bar to see contact details';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Number of Unique Contacts'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    onClick: (event: unknown, elements: { index: number }[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const clickedDate = chartData[index].date;
        const contactCount = chartData[index].uniqueContacts;
        
        if (contactCount > 0) {
          fetchContactDetails(clickedDate);
        }
      }
    },
  };

  // Calculate summary statistics
  const totalUniqueContacts = chartData.reduce((sum, item) => sum + item.uniqueContacts, 0);
  const averagePerDay = chartData.length > 0 ? (totalUniqueContacts / chartData.length).toFixed(1) : '0';
  const maxInDay = chartData.length > 0 ? Math.max(...chartData.map(item => item.uniqueContacts)) : 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="text-lg font-semibold">Error Loading Unique Contacts Chart</p>
          <p className="text-sm mt-2">{error}</p>
          <button 
            onClick={() => fetchUniqueContactsData(timePeriod)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Header and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Unique Contacts Monitoring
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track daily unique contacts interacting with the system. Click bars for details.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIME_PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalUniqueContacts}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Total Unique Contacts
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {averagePerDay}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Average per Day
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {maxInDay}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              Peak in Single Day
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <Bar data={chartConfig} options={chartOptions} />
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 Tip: Click on any bar to view the list of contacts for that specific date
        </div>
      </div>

      {/* Contact Details Modal */}
      {showContactDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Contacts for {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {contactDetails.length} unique contact{contactDetails.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowContactDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {contactDetailsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : contactDetails.length > 0 ? (
                <div className="space-y-3">
                  {contactDetails.map((contact, index) => (
                    <div key={`${contact.contactId}-${index}`} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {contact.contactName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ID: {contact.contactId}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {contact.chatCount} chat{contact.chatCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No contacts found for this date.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UniqueContactsChart;