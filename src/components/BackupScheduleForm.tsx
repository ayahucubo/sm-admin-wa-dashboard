import React, { useState, useEffect } from 'react';

interface BackupScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6, Sunday = 0
  hour: number; // 0-23
  minute: number; // 0-59
  databases: ('primary' | 'n8n' | 'both')[];
  retention: {
    keepWeekly: number; // Number of weekly backups to keep
    keepMonthly: number; // Number of monthly backups to keep
  };
}

interface BackupScheduleFormProps {
  schedule: BackupScheduleConfig;
  onSave: (schedule: BackupScheduleConfig) => void;
  onCancel: () => void;
  loading: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export default function BackupScheduleForm({ schedule, onSave, onCancel, loading }: BackupScheduleFormProps) {
  const [formData, setFormData] = useState<BackupScheduleConfig>(schedule);

  useEffect(() => {
    setFormData(schedule);
  }, [schedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: keyof BackupScheduleConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRetentionChange = (field: keyof BackupScheduleConfig['retention'], value: number) => {
    setFormData(prev => ({
      ...prev,
      retention: { ...prev.retention, [field]: value }
    }));
  };

  const handleDatabasesChange = (database: 'primary' | 'n8n' | 'both', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      databases: checked 
        ? [...prev.databases, database]
        : prev.databases.filter(db => db !== database)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-6">
        {/* Enable/Disable Schedule */}
        <div className="flex items-center">
          <input
            id="enabled"
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => handleInputChange('enabled', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="enabled" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
            Enable Automatic Backups
          </label>
        </div>

        {formData.enabled && (
          <>
            {/* Backup Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Backup Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleInputChange('frequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Day of Week (for weekly backups) */}
            {formData.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Day of Week
                </label>
                <select
                  value={formData.dayOfWeek || 0}
                  onChange={(e) => handleInputChange('dayOfWeek', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hour (0-23)
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.hour}
                  onChange={(e) => handleInputChange('hour', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minute (0-59)
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.minute}
                  onChange={(e) => handleInputChange('minute', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Databases to Backup */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Databases to Backup
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="db-primary"
                    type="checkbox"
                    checked={formData.databases.includes('primary')}
                    onChange={(e) => handleDatabasesChange('primary', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="db-primary" className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                    Primary Database (PostgreSQL)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="db-n8n"
                    type="checkbox"
                    checked={formData.databases.includes('n8n')}
                    onChange={(e) => handleDatabasesChange('n8n', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="db-n8n" className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                    N8N Database
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="db-both"
                    type="checkbox"
                    checked={formData.databases.includes('both')}
                    onChange={(e) => handleDatabasesChange('both', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="db-both" className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                    Both Databases (Combined Backup)
                  </label>
                </div>
              </div>
            </div>

            {/* Retention Policy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Retention Policy
              </label>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Keep Weekly Backups
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={formData.retention.keepWeekly}
                    onChange={(e) => handleRetentionChange('keepWeekly', parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    weeks (older weekly backups will be deleted)
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Keep Monthly Backups
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.retention.keepMonthly}
                    onChange={(e) => handleRetentionChange('keepMonthly', parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    months (older monthly backups will be deleted)
                  </span>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Retention Logic:</strong> When a new month starts, the system will automatically delete 
                    weekly backups from the previous month (keeping only {formData.retention.keepWeekly} weeks) 
                    and replace them with the new month's weekly backups. Monthly backups are kept for 
                    {formData.retention.keepMonthly} months.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.enabled || formData.databases.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Save Schedule
          </button>
        </div>
      </div>
    </form>
  );
}