"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { getApiPath } from '@/utils/api';
import { authenticatedGet } from '@/utils/authenticatedFetch';

interface KnowledgeBenefitRecord {
  ID: string;
  sme: string;
  Status_Update: string;
  'Status Train': string;  // Changed to match CSV header with space
  skema: string;
  company: string;
  kategori: string;
  kategori_sub: string;
  knowledge_code: string;
  bab: string;
  bab_no: string;
  bagian: string;
  paragraf: string;
  pasal: string;
  pasal_no: string;
  pasal_description: string;
  keyword: string;
  text: string;
}

interface ApiResponse {
  success: boolean;
  data: KnowledgeBenefitRecord[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters?: {
    categories: string[];
  };
  error?: string;
}

// Modal component for displaying full text content - REMOVED (no longer needed)

export default function KnowledgeBenefitMenuPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KnowledgeBenefitRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowMessage, setWorkflowMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      fetchData();
    }
  }, [router]);

  // Auto-refresh effect - refreshes table data every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true); // Silent refresh (don't show loading)
    }, 1000); // 1 second interval

    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setError(null);
      }
      
      // Fetch ALL data without pagination, search, or filters
      const params = new URLSearchParams({
        limit: '10000', // Large number to get all records
        offset: '0'
      });
      
      const response = await authenticatedGet(getApiPath(`api/knowledge-benefit?${params}`));
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setTotal(result.total || 0);
        setLastUpdate(new Date());
      } else {
        if (!silent) {
          setError(result.error || 'Failed to fetch knowledge data');
        }
      }
    } catch (error) {
      console.error('Error fetching knowledge data:', error);
      if (!silent) {
        setError(error instanceof Error ? error.message : 'Failed to fetch knowledge data');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const handleStartWorkflow = useCallback(async () => {
    setWorkflowLoading(true);
    setWorkflowMessage(null);
    
    try {
      const webhookPayload = {
        "event_type": "update_cc_knowledge_benefit",
        "timestamp": new Date().toISOString(),
        "data": {
          "status": "active"
        },
        "metadata": {
          "source": "webhook_test",
          "version": "1.0",
          "request_id": `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      };

      const response = await fetch('https://wecare.techconnect.co.id/webhook-test/update-cc-knowledge-benefit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      if (response.ok) {
        const result = await response.text();
        setWorkflowMessage({
          type: 'success',
          text: `Workflow started successfully! Response: ${result || 'OK'}`
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error starting workflow:', error);
      setWorkflowMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to start workflow'
      });
    } finally {
      setWorkflowLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-900 dark:text-white font-medium">Loading Knowledge Benefit Data...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Knowledge Benefit Menu" 
      subtitle={`Complete Excel-like view • Data source: Google Sheets • Total records: ${total}`}
    >
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        {/* Page Actions */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Workflow button and status */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                {/* Start Workflow Button */}
                <button
                  onClick={handleStartWorkflow}
                  disabled={workflowLoading}
                  className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
                >
                  {workflowLoading ? (
                    <>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <span>Start Workflow</span>
                    </>
                  )}
                </button>
                
                {/* Auto-refresh status indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 px-2 py-1.5 sm:py-1 rounded border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-center sm:justify-start">
                    <svg className="w-3 h-3 mr-1.5 text-green-600 animate-pulse flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span className="whitespace-nowrap text-center sm:text-left">
                      Auto-refresh every 1 second
                    </span>
                  </div>
                  <span className="text-center sm:text-left mt-1 sm:mt-0 sm:ml-2 font-medium">
                    Last update: {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-200">
                  Data Loading Error
                </h3>
                <div className="mt-2 text-xs sm:text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Status Alert */}
      {workflowMessage && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
          <div className={`border rounded-lg p-3 sm:p-4 ${
            workflowMessage.type === 'success' 
              ? 'bg-white dark:bg-black/20 border-black-200 dark:border-black-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex justify-between items-start">
              <div className="flex">
                <div className="flex-shrink-0">
                  {workflowMessage.type === 'success' ? (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-xs sm:text-sm font-medium ${
                    workflowMessage.type === 'success'
                      ? 'text-green-500 dark:text-green-1300'
                      : 'text-red-500 dark:text-red-1300'
                  }`}>
                    {workflowMessage.type === 'success' ? 'Workflow Status' : 'Workflow Error'}
                  </h3>
                  <div className={`mt-2 text-xs sm:text-sm ${
                    workflowMessage.type === 'success'
                      ? 'text-green-500 dark:text-green-1300'
                      : 'text-red-500 dark:text-red-1300'
                  }`}>
                    <p>{workflowMessage.text}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setWorkflowMessage(null)}
                className={`text-gray-700 hover:text-gray-900 dark:hover:text-gray-300 ml-4 ${
                  workflowMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        {/* Search and Filters - REMOVED */}

        {/* Data Table - Excel-like Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table Header Info */}
          <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Knowledge Benefit Data
                </h3>
                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {total} records
                </span>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Excel-like view
                </span>
              </div>
            </div>
          </div>
          
          {/* Table Container - Fully Scrollable */}
          <div className="overflow-auto max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-220px)] md:max-h-[calc(100vh-250px)] w-full">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs sm:text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[50px] sm:min-w-[70px]">
                    ID
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[60px] sm:min-w-[90px]">
                    SME
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[80px] sm:min-w-[120px]">
                    Status Update
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[80px] sm:min-w-[120px]">
                    Status Train
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[70px] sm:min-w-[100px]">
                    Skema
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[80px] sm:min-w-[120px]">
                    Company
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[80px] sm:min-w-[120px]">
                    Kategori
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[100px] sm:min-w-[140px]">
                    Kategori Sub
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[100px] sm:min-w-[140px]">
                    Knowledge Code
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[80px] sm:min-w-[120px]">
                    Bab
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[60px] sm:min-w-[90px]">
                    Bab No
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[80px] sm:min-w-[120px]">
                    Bagian
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[80px] sm:min-w-[120px]">
                    Paragraf
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[80px] sm:min-w-[120px]">
                    Pasal
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[60px] sm:min-w-[90px]">
                    Pasal No
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[150px] sm:min-w-[220px]">
                    Pasal Description
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[120px] sm:min-w-[170px]">
                    Keyword
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider min-w-[200px] sm:min-w-[320px]">
                    Text
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((record, index) => (
                  <tr key={record.ID} className={`hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}`}>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 font-medium border-r border-gray-200 dark:border-gray-600">
                      {record.ID}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.sme}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.Status_Update}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record['Status Train']}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.skema}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.company}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.kategori}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.kategori_sub}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.knowledge_code}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.bab}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.bab_no}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.bagian}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.paragraf}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.pasal}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                      {record.pasal_no}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600 max-w-[150px] sm:max-w-[220px]">
                      <div className="whitespace-pre-wrap break-words">
                        {record.pasal_description}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600 max-w-[120px] sm:max-w-[170px]">
                      <div className="whitespace-pre-wrap break-words">
                        {record.keyword}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 max-w-[200px] sm:max-w-[320px]">
                      <div className="whitespace-pre-wrap break-words">
                        {record.text}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {data.length === 0 && !loading && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Knowledge Data Available
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 px-4">
              The Google Sheets data source appears to be empty or unavailable.
            </p>
            <button
              onClick={() => fetchData(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium text-sm sm:text-base"
            >
              Try Refreshing
            </button>
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
}