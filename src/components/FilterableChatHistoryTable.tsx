"use client";
import React, { useState, useEffect, useMemo } from 'react';
import localApi from '@/utils/localApi';

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

// Interface for API response
interface ChatHistoryResponse {
  success: boolean;
  data: ChatHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    currentMenu?: string;
    startDate?: string;
    endDate?: string;
  };
}

// Available menu options - using actual values from database
const MENU_OPTIONS = [
  'Industrial Relation',
  'Jeanny', 
  'Benefit',
  'Peraturan Perusahaan',
  'Promosi',
  'Cuti',
  'Data Cuti'
];

export default function FilterableChatHistoryTable() {
  // State management
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Fetch chat history from API
  const fetchChatHistory = async (resetPage = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // Add filters
      if (selectedMenu) {
        params.append('currentMenu', selectedMenu);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      
      // Add pagination
      params.append('page', resetPage ? '1' : currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      console.log('Fetching chat history with params:', params.toString());
      
      const response = await localApi.get(`/api/chat/history-filtered?${params.toString()}`);
      const data: ChatHistoryResponse = response.data;
      
      if (data.success) {
        setChatHistory(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
        if (resetPage) {
          setCurrentPage(1);
        }
      } else {
        throw new Error('Failed to fetch chat history');
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat history');
      setChatHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchChatHistory(true);
  }, [selectedMenu, startDate, endDate]);

  // When page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchChatHistory(false);
    }
  }, [currentPage]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedMenu('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  // Get pagination range
  const paginationRange = useMemo(() => {
    const range = [];
    const showPages = 5;
    const halfShow = Math.floor(showPages / 2);
    
    let start = Math.max(1, currentPage - halfShow);
    let end = Math.min(totalPages, start + showPages - 1);
    
    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Riwayat Obrolan Detail
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Riwayat obrolan lengkap dengan kemampuan filter
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Menu Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Menu
            </label>
            <select
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Semua Menu</option>
              {MENU_OPTIONS.map(menu => (
                <option key={menu} value={menu}>
                  {menu}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedMenu && (
              <span className="mr-4">
                Menu: {selectedMenu}
              </span>
            )}
            {(startDate || endDate) && (
              <span>
                Rentang tanggal: {startDate || 'Semua'} - {endDate || 'Semua'}
              </span>
            )}
          </div>
          <button
            onClick={clearFilters}
            disabled={!selectedMenu && !startDate && !endDate}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Hapus Filter
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Menampilkan {chatHistory.length} dari {totalItems} hasil
          </span>
          {totalPages > 1 && (
            <span>
              Halaman {currentPage} dari {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Memuat riwayat obrolan...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium">Error memuat riwayat obrolan</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error}</p>
              <button
                onClick={() => fetchChatHistory(true)}
                className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Tidak ada riwayat obrolan ditemukan</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Coba sesuaikan filter Anda atau periksa kembali nanti
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Table Header Info */}
            <div className="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    Total Records: {totalItems} | Showing: {chatHistory.length}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (Columns: 5)
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Chat history • Scroll horizontally and vertically
                </div>
              </div>
            </div>
            
            {/* Table Container with Compact Height */}
            <div className="enhanced-table-scroll" style={{ maxHeight: '60vh' }}>
              <div className="min-w-max">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky-header">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 dark:border-gray-600 min-w-[120px]">
                        Kontak
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 dark:border-gray-600 min-w-[140px]">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 dark:border-gray-600 min-w-[150px]">
                        Current Menu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 dark:border-gray-600 min-w-[250px]">
                        Pesan Masuk
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap border-r-0 min-w-[300px]">
                        Jawaban
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {chatHistory.map((item, index) => (
                      <tr key={item.executionId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="table-cell-enhanced px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600"
                            title={item.contact || '-'}>
                          <div className="break-words font-medium">
                            {item.contact || '-'}
                          </div>
                        </td>
                        <td className="table-cell-enhanced px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600"
                            title={formatDate(item.startedAt)}>
                          <div className="break-words">
                            {formatDate(item.startedAt)}
                          </div>
                        </td>
                        <td className="table-cell-enhanced px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600"
                            title={item.currentMenu || '-'}>
                          <div className="break-words">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {item.currentMenu || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell-enhanced px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600"
                            title={item.chat || '-'}>
                          <div className="break-words">
                            {item.chat || '-'}
                          </div>
                        </td>
                        <td className="table-cell-enhanced px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100 border-r-0"
                            title={item.chatResponse || '-'}>
                          <div className="break-words">
                            {item.chatResponse || '-'}
                            {item.workflowId && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                <a
                                  href={`https://wecare.techconnect.co.id/workflow/${item.workflowId}/executions/${item.executionId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                >
                                  Lihat Eksekusi →
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Scrolling Instructions */}
            <div className="px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>💡 Scroll horizontally and vertically within the table area • Scroll page to see more content</span>
                <span>Showing {chatHistory.length} of {totalItems} records</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && !error && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} hingga {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} hasil
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Previous button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Sebelumnya
              </button>
              
              {/* Page numbers */}
              {paginationRange.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    page === currentPage
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {/* Next button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}