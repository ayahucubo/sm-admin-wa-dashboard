"use client";
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import localApi from '@/utils/localApi';
import BackupScheduleForm from './BackupScheduleForm';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Interface for database storage information
interface DatabaseSizeInfo {
  databaseName: string;
  totalSize: string;
  totalSizeBytes: number;
}

interface TableSizeInfo {
  tableName: string;
  schemaName: string;
  tableSize: string;
  tableSizeBytes: number;
  indexSize: string;
  indexSizeBytes: number;
  totalSize: string;
  totalSizeBytes: number;
  rowCount: number;
}

interface DatabaseStorageStats {
  databaseInfo: DatabaseSizeInfo;
  tables: TableSizeInfo[];
  totalTables: number;
  connectionInfo: {
    host: string;
    port: number;
    database: string;
  };
}

interface StorageResponse {
  success: boolean;
  data: {
    summary: {
      totalDatabases: number;
      combinedSize: number;
      combinedSizePretty: string;
      totalTables: number;
      retrievedAt: string;
    };
    primaryDatabase: DatabaseStorageStats | null;
    n8nDatabase: DatabaseStorageStats | null;
  };
  error?: string;
}

// Color palette for charts
const STORAGE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export default function DatabaseStorageMonitor() {
  const [storageData, setStorageData] = useState<StorageResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'primary' | 'n8n'>('overview');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState<string>('');
  
  // Backup scheduling states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [backupSchedule, setBackupSchedule] = useState<any>(null);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);

  // Fetch database storage data
  const fetchStorageData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching database storage information...');
      
      const params = new URLSearchParams({
        includeTableDetails: 'true',
        limitTables: '10' // Get top 10 tables for each database
      });
      
      const response = await localApi.get(`/api/monitoring/database-storage?${params.toString()}`);
      const data: StorageResponse = response.data;
      
      if (data.success) {
        setStorageData(data.data);
        console.log('Database storage data loaded successfully');
      } else {
        throw new Error(data.error || 'Failed to fetch database storage data');
      }
    } catch (err) {
      console.error('Error fetching database storage data:', err);
      
      let errorMessage = 'Failed to load database storage data';
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('Network Error')) {
          errorMessage = 'Network connection error. Please check your connection.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setStorageData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle database backup
  const handleDatabaseBackup = async (databaseType: 'primary' | 'n8n' | 'both') => {
    setBackupLoading(true);
    setBackupProgress(`Preparing backup for ${databaseType} database...`);
    
    try {
      console.log(`Starting backup for ${databaseType} database(s)...`);
      
      const backupRequest = {
        databases: [databaseType],
        includeData: true,
        schemaOnly: false,
        format: 'zip' as const
      };
      
      setBackupProgress('Analyzing database structure...');
      
      // Show warning for large databases
      if (databaseType === 'both') {
        const confirmBackup = confirm(
          '⚠️ Backing up both databases may take several minutes.\n\n' +
          'The backup will be created as a ZIP archive containing SQL files.\n' +
          'Large tables will be processed in chunks to ensure complete backup.\n\n' +
          'Do you want to continue?'
        );
        
        if (!confirmBackup) {
          setBackupLoading(false);
          setBackupProgress('');
          return;
        }
      }
      
      setBackupProgress('Generating database backup... This may take up to 15 minutes.');
      
      const response = await localApi.post('/api/monitoring/database-backup', backupRequest, {
        timeout: 900000, // 15 minutes to allow for large table backup processing
        onUploadProgress: () => {
          setBackupProgress('Uploading backup data...');
        }
      });
      
      if (response.data.success) {
        const { fileName, fileSize, downloadUrl, databases, duration, tablesBackedUp } = response.data.data;
        
        setBackupProgress(`Backup completed! Downloading ${fileName}...`);
        
        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        alert(`✅ Database backup completed successfully!\n\n` +
              `File: ${fileName}\n` +
              `Format: ZIP Archive\n` +
              `Size: ${formatBytes(fileSize)}\n` +
              `Databases: ${databases.join(', ')}\n` +
              `Tables: ${tablesBackedUp}\n` +
              `Duration: ${(duration / 1000).toFixed(1)}s\n\n` +
              `The ZIP backup has been downloaded to your computer.\n\n` +
              `Note: Large tables were processed in chunks for complete backup.`);
        
        console.log(`✅ Database backup completed:`, response.data.data);
      } else {
        throw new Error(response.data.error || 'Backup failed');
      }
    } catch (err) {
      console.error('Error creating database backup:', err);
      
      let errorMessage = 'Failed to create database backup';
      let suggestions = '';
      
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Backup timed out due to large database size.';
          suggestions = '\n\nSuggestions:\n' +
                       '• Try backing up individual databases instead of both\n' +
                       '• Use manual database tools for very large datasets\n' +
                       '• Contact administrator for assistance with large backups';
        } else if (err.message.includes('Network Error')) {
          errorMessage = 'Network connection error during backup.';
          suggestions = '\n\nPlease check your connection and try again.';
        } else if (err.message.includes('denied') || err.message.includes('401')) {
          errorMessage = 'Access denied. Please login again.';
          suggestions = '\n\nYour session may have expired.';
        } else {
          errorMessage = err.message;
        }
      }
      
      alert(`❌ Backup failed: ${errorMessage}${suggestions}`);
      setError(errorMessage);
    } finally {
      setBackupLoading(false);
      setBackupProgress('');
    }
  };

  // Initial load
  useEffect(() => {
    fetchStorageData();
    fetchBackupSchedule();
    fetchBackupStatistics();
    fetchSchedulerStatus();
  }, []);

  // Fetch backup schedule and statistics
  const fetchBackupSchedule = async () => {
    try {
      const response = await localApi.get('/api/monitoring/backup-schedule');
      if (response.data.success) {
        setBackupSchedule(response.data.data.schedule);
      }
    } catch (error) {
      console.error('Error fetching backup schedule:', error);
    }
  };

  const fetchBackupStatistics = async () => {
    try {
      const response = await localApi.get('/api/monitoring/backup-schedule?action=statistics');
      if (response.data.success) {
        setBackupStats(response.data.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching backup statistics:', error);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const response = await localApi.get('/api/monitoring/backup-scheduler');
      if (response.data.success) {
        setSchedulerStatus(response.data.data.scheduler);
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    }
  };

  // Create scheduled backup
  const handleScheduledBackup = async (type: 'weekly' | 'monthly') => {
    setScheduleLoading(true);
    try {
      console.log(`🚀 Starting ${type} backup creation...`);
      
      const response = await localApi.post('/api/monitoring/backup-schedule', {
        action: 'create-backup',
        backupType: type
      }, {
        timeout: 900000, // 15 minutes timeout for backup operations
        onUploadProgress: () => {
          console.log('📤 Backup data uploading...');
        }
      });
      
      if (response.data.success) {
        console.log(`✅ ${type} backup completed successfully:`, response.data.data);
        alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} backup created successfully!\n\nFile: ${response.data.data.fileName}\nSize: ${formatBytes(response.data.data.fileSize)}`);
        fetchBackupStatistics(); // Refresh statistics
      } else {
        throw new Error(response.data.error || 'Backup creation failed');
      }
    } catch (error) {
      console.error(`❌ Error creating ${type} backup:`, error);
      
      let errorMessage = `Failed to create ${type} backup`;
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} backup timed out after 15 minutes. The database may be too large or the server is overloaded.`;
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'Network connection error during backup. Please check your connection and try again.';
        } else {
          errorMessage = `${errorMessage}: ${error.message}`;
        }
      }
      
      alert(`❌ ${errorMessage}\n\nSuggestions:\n• Try again later when server load is lower\n• Check if the database size has grown significantly\n• Consider using manual database tools for very large datasets`);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Save backup schedule
  const handleSaveSchedule = async (scheduleConfig: any) => {
    setScheduleLoading(true);
    try {
      const response = await localApi.post('/api/monitoring/backup-schedule', {
        action: 'update-schedule',
        schedule: scheduleConfig
      });
      
      if (response.data.success) {
        setBackupSchedule(scheduleConfig);
        setShowScheduleModal(false);
        alert('✅ Backup schedule updated successfully!');
      } else {
        throw new Error(response.data.error || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving backup schedule:', error);
      alert(`❌ Failed to save backup schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Cleanup old backups
  const handleCleanupBackups = async () => {
    if (!confirm('Are you sure you want to clean up old backups according to the retention policy?')) {
      return;
    }
    
    setScheduleLoading(true);
    try {
      const response = await localApi.post('/api/monitoring/backup-schedule', {
        action: 'cleanup-backups'
      });
      
      if (response.data.success) {
        alert('✅ Backup cleanup completed successfully!');
        fetchBackupStatistics(); // Refresh statistics
      } else {
        throw new Error(response.data.error || 'Cleanup failed');
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
      alert(`❌ Failed to cleanup backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Control backup scheduler
  const handleSchedulerControl = async (action: 'start' | 'stop' | 'trigger') => {
    setScheduleLoading(true);
    try {
      console.log(`🎛️ Scheduler action: ${action}`);
      
      // Use longer timeout for trigger action since it creates a backup
      const timeout = action === 'trigger' ? 900000 : 30000; // 15 mins for trigger, 30 secs for start/stop
      
      const response = await localApi.post('/api/monitoring/backup-scheduler', { action }, {
        timeout: timeout
      });
      
      if (response.data.success) {
        console.log(`✅ Scheduler ${action} completed:`, response.data.data);
        alert(`✅ ${response.data.data.message}`);
        fetchSchedulerStatus(); // Refresh scheduler status
        if (action === 'trigger') {
          fetchBackupStatistics(); // Refresh statistics if backup was triggered
        }
      } else {
        throw new Error(response.data.error || `Failed to ${action} scheduler`);
      }
    } catch (error) {
      console.error(`❌ Error ${action}ing scheduler:`, error);
      
      let errorMessage = `Failed to ${action} scheduler`;
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          if (action === 'trigger') {
            errorMessage = 'Backup trigger timed out after 15 minutes. The backup may still be processing in the background.';
          } else {
            errorMessage = `Scheduler ${action} operation timed out.`;
          }
        } else {
          errorMessage = `${errorMessage}: ${error.message}`;
        }
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Utility function to format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Prepare overview pie chart data
  const getOverviewChartData = () => {
    if (!storageData?.primaryDatabase || !storageData?.n8nDatabase) return null;

    return {
      labels: ['Primary Database (postgres)', 'N8N Database (n8ndb)'],
      datasets: [
        {
          data: [
            storageData.primaryDatabase.databaseInfo.totalSizeBytes,
            storageData.n8nDatabase.databaseInfo.totalSizeBytes
          ],
          backgroundColor: [STORAGE_COLORS[0], STORAGE_COLORS[1]],
          borderColor: [STORAGE_COLORS[0], STORAGE_COLORS[1]],
          borderWidth: 2,
        }
      ]
    };
  };

  // Prepare table size chart data for a specific database
  const getTableChartData = (database: DatabaseStorageStats) => {
    const topTables = database.tables.slice(0, 8); // Show top 8 tables
    
    return {
      labels: topTables.map(table => `${table.schemaName}.${table.tableName}`),
      datasets: [
        {
          label: 'Table Size',
          data: topTables.map(table => table.tableSizeBytes),
          backgroundColor: STORAGE_COLORS[2],
          borderColor: STORAGE_COLORS[2],
          borderWidth: 1,
        },
        {
          label: 'Index Size',
          data: topTables.map(table => table.indexSizeBytes),
          backgroundColor: STORAGE_COLORS[3],
          borderColor: STORAGE_COLORS[3],
          borderWidth: 1,
        }
      ]
    };
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const value = context.raw as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatBytes(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const value = context.raw as number;
            return `${context.dataset.label}: ${formatBytes(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
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
        ticks: {
          callback: function(value: any) {
            return formatBytes(value as number);
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
            <p className="text-gray-600 dark:text-gray-400">Loading database storage information...</p>
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Failed to Load Storage Data</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchStorageData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!storageData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No storage data available</p>
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
              Database Storage Monitor
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Storage usage for postgres and n8ndb databases ({storageData.summary.combinedSizePretty} total, {storageData.summary.totalTables} tables)
            </p>
            {backupProgress && (
              <div className="mt-2 flex items-center gap-2">
                <div className="loading-spinner w-4 h-4"></div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {backupProgress}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* View Selector */}
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value as 'overview' | 'primary' | 'n8n')}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="primary">Primary Database</option>
              <option value="n8n">N8N Database</option>
            </select>

            {/* Backup Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDatabaseBackup('primary')}
                disabled={loading || backupLoading}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                title="Backup Primary Database"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Backup Primary
              </button>
              
              <button
                onClick={() => handleDatabaseBackup('n8n')}
                disabled={loading || backupLoading}
                className="px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                title="Backup N8N Database"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Backup N8N
              </button>
              
              <button
                onClick={() => handleDatabaseBackup('both')}
                disabled={loading || backupLoading}
                className="px-3 py-2 text-sm font-medium text-white bg-purple-600 border border-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                title="Backup Both Databases"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Backup All
              </button>
            </div>
            
            {/* Backup Schedule Management */}
            <div className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-4">
              <button
                onClick={() => setShowScheduleModal(true)}
                disabled={scheduleLoading}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                title="Manage Backup Schedule"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Schedule
              </button>
              
              <button
                onClick={() => handleScheduledBackup('weekly')}
                disabled={scheduleLoading || backupLoading}
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                title="Create Weekly Backup Now"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Weekly
              </button>
              
              <button
                onClick={() => handleScheduledBackup('monthly')}
                disabled={scheduleLoading || backupLoading}
                className="px-3 py-2 text-sm font-medium text-white bg-orange-600 border border-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                title="Create Monthly Backup Now"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H3a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                </svg>
                Monthly
              </button>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchStorageData}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              title="Refresh Storage Data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Backup Progress Indicator */}
      {backupLoading && (
        <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="loading-spinner w-5 h-5"></div>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Creating Database Backup...
              </p>
              {backupProgress && (
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  {backupProgress}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg mr-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Primary DB</p>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {storageData.primaryDatabase?.databaseInfo.totalSize || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg mr-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">N8N DB</p>
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                  {storageData.n8nDatabase?.databaseInfo.totalSize || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg mr-3">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Size</p>
                <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  {storageData.summary.combinedSizePretty}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg mr-3">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Tables</p>
                <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                  {storageData.summary.totalTables}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Statistics */}
        {backupStats && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Backup Statistics</h4>
              {schedulerStatus && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${schedulerStatus.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Scheduler: {schedulerStatus.running ? 'Running' : 'Stopped'}
                  </span>
                  <button
                    onClick={() => handleSchedulerControl(schedulerStatus.running ? 'stop' : 'start')}
                    disabled={scheduleLoading}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      schedulerStatus.running 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {schedulerStatus.running ? 'Stop' : 'Start'}
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{backupStats.totalBackups}</div>
                <div className="text-gray-600 dark:text-gray-400">Total Backups</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{backupStats.weeklyBackups}</div>
                <div className="text-gray-600 dark:text-gray-400">Weekly</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{backupStats.monthlyBackups}</div>
                <div className="text-gray-600 dark:text-gray-400">Monthly</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{backupStats.manualBackups}</div>
                <div className="text-gray-600 dark:text-gray-400">Manual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatBytes(backupStats.totalSize)}</div>
                <div className="text-gray-600 dark:text-gray-400">Total Size</div>
              </div>
              <div className="text-center space-y-1">
                <button
                  onClick={() => handleSchedulerControl('trigger')}
                  disabled={scheduleLoading}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors block w-full"
                  title="Trigger backup check now"
                >
                  Trigger
                </button>
                <button
                  onClick={handleCleanupBackups}
                  disabled={scheduleLoading}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors block w-full"
                  title="Clean up old backups according to retention policy"
                >
                  Cleanup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {selectedView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Distribution Pie Chart */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Database Size Distribution
              </h4>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getOverviewChartData() ? (
                  <Pie data={getOverviewChartData()!} options={pieOptions} />
                ) : (
                  <p className="text-gray-500">No data available</p>
                )}
              </div>
            </div>

            {/* Connection Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Connection Information
              </h4>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Primary Database</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {storageData.primaryDatabase?.connectionInfo.host}:{storageData.primaryDatabase?.connectionInfo.port}/{storageData.primaryDatabase?.connectionInfo.database}
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">N8N Database</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {storageData.n8nDatabase?.connectionInfo.host}:{storageData.n8nDatabase?.connectionInfo.port}/{storageData.n8nDatabase?.connectionInfo.database}
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Last Updated</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(storageData.summary.retrievedAt).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'primary' && storageData.primaryDatabase && (
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
              Primary Database ({storageData.primaryDatabase.databaseInfo.databaseName}) - Table Sizes
            </h4>
            <div style={{ height: '400px' }}>
              <Bar data={getTableChartData(storageData.primaryDatabase)} options={barOptions} />
            </div>
            
            {/* Table Details */}
            <div className="mt-6">
              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Top Tables</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Table</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Table Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Index Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rows</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {storageData.primaryDatabase.tables.slice(0, 5).map((table, index) => (
                      <tr key={`${table.schemaName}.${table.tableName}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {table.schemaName}.{table.tableName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{table.tableSize}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{table.indexSize}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{table.totalSize}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {table.rowCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'n8n' && storageData.n8nDatabase && (
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
              N8N Database ({storageData.n8nDatabase.databaseInfo.databaseName}) - Table Sizes
            </h4>
            <div style={{ height: '400px' }}>
              <Bar data={getTableChartData(storageData.n8nDatabase)} options={barOptions} />
            </div>
            
            {/* Table Details */}
            <div className="mt-6">
              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Top Tables</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Table</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Table Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Index Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rows</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {storageData.n8nDatabase.tables.slice(0, 5).map((table, index) => (
                      <tr key={`${table.schemaName}.${table.tableName}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {table.schemaName}.{table.tableName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{table.tableSize}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{table.indexSize}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{table.totalSize}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {table.rowCount.toLocaleString()}
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

      {/* Backup Schedule Modal */}
      {showScheduleModal && backupSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Backup Schedule Configuration
                </h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <BackupScheduleForm
              schedule={backupSchedule}
              onSave={handleSaveSchedule}
              onCancel={() => setShowScheduleModal(false)}
              loading={scheduleLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}