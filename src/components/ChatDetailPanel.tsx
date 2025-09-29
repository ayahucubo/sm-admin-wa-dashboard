"use client";
import React, { useEffect, useState } from "react";
import api from "@/utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ChatHistoryItem {
  executionId: string;
  startedAt: string;
  chat: string;
  chatResponse: string;
  currentMenu: string;
  workflowId: string;
  workflowName: string;
}

interface ChatDetailPanelProps {
  nohp: string | null;
}

export default function ChatDetailPanel({ nohp }: ChatDetailPanelProps) {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string>("");

  // Fetch history from API when nohp, start, or end date changes
  useEffect(() => {
    if (!nohp) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const params: any = { nohp };
        if (start) params.start = start.toISOString().slice(0, 10);
        if (end) params.end = end.toISOString().slice(0, 10);
        const res = await api.get("/api/chat/history", { params });
        // Mapping snake_case ke camelCase
        const mapped = res.data.map((item: any) => ({
          executionId: item.execution_id,
          startedAt: item.started_at,
          chat: item.chat,
          chatResponse: item.chat_response,
          currentMenu: item.current_menu,
          workflowId: item.workflow_id,
          workflowName: item.workflow_name,
        }));
        setHistory(mapped);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [nohp, start, end]);

  // Filter history by selected menu
  useEffect(() => {
    if (!selectedMenu) {
      setFilteredHistory(history);
    } else {
      const filtered = history.filter(item => item.currentMenu === selectedMenu);
      setFilteredHistory(filtered);
    }
  }, [history, selectedMenu]);

  // Get unique menus for filter dropdown
  const uniqueMenus = React.useMemo(() => {
    const menus = Array.from(new Set(history.map(item => item.currentMenu).filter(Boolean)));
    return menus.sort();
  }, [history]);

  if (!nohp) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-primary mb-2">Pilih Chat</h3>
          <p className="text-muted text-sm sm:text-base">Pilih chat dari sidebar untuk melihat detail percakapan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Fixed Filter Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 flex-shrink-0">
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-3 sm:gap-4">
          <div className="flex-1 w-full">
            <label className="block text-secondary font-semibold mb-2 text-sm sm:text-base">Filter Tanggal</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1">
                <DatePicker
                  selected={start}
                  onChange={date => setStart(date)}
                  selectsStart
                  startDate={start || undefined}
                  endDate={end || undefined}
                  placeholderText="Tanggal mulai"
                  className="w-full text-sm sm:text-base"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div className="flex-1">
                <DatePicker
                  selected={end}
                  onChange={date => setEnd(date)}
                  selectsEnd
                  startDate={start || undefined}
                  endDate={end || undefined}
                  minDate={start || undefined}
                  placeholderText="Tanggal akhir"
                  className="w-full text-sm sm:text-base"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full lg:max-w-xs">
            <label className="block text-secondary font-semibold mb-2 text-sm sm:text-base">Filter Menu</label>
            <select
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Menu</option>
              {uniqueMenus.map((menu) => (
                <option key={menu} value={menu}>
                  {menu}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => { 
              setStart(null); 
              setEnd(null); 
              setSelectedMenu(""); 
            }}
            className="btn-secondary px-3 sm:px-4 py-2 w-full lg:w-auto text-sm sm:text-base"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Scrollable Chat History */}
      <div className="flex-1 scrollable-content p-3 sm:p-4 lg:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="loading-spinner mr-3"></div>
            <span className="text-secondary text-sm sm:text-base">Memuat riwayat chat...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
              {history.length === 0 ? "Tidak ada riwayat" : "Tidak ada hasil"}
            </h3>
            <p className="text-muted text-sm sm:text-base">
              {history.length === 0 
                ? "Belum ada percakapan untuk ditampilkan" 
                : "Tidak ada percakapan yang sesuai dengan filter yang dipilih"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredHistory.map((item, idx) => (
              <div key={item.executionId + idx} className="space-y-3 sm:space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[70%] bg-blue-600 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
                    <div className="font-medium mb-1 text-sm sm:text-base">{item.chat}</div>
                    <div className="text-blue-100 text-xs opacity-80">
                      {new Date(item.startedAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Bot Response */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[70%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
                    <div className="font-medium text-primary mb-2 text-sm sm:text-base">{item.chatResponse}</div>
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center text-xs text-muted">
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="truncate">Menu: {item.currentMenu}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted">
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="truncate">Workflow: {item.workflowName}</span>
                      </div>
                      <a
                        href={`https://wecare.techconnect.co.id/workflow/${item.workflowId}/executions/${item.executionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        title={`workflowId: ${item.workflowId}\nname: ${item.workflowName}`}
                      >
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="truncate">Lihat Execution</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 