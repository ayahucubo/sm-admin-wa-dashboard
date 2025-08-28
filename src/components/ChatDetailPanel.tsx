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
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

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

  if (!nohp) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">Pilih Chat</h3>
          <p className="text-muted">Pilih chat dari sidebar untuk melihat detail percakapan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Fixed Filter Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-secondary font-semibold mb-2">Filter Tanggal</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <DatePicker
                  selected={start}
                  onChange={date => setStart(date)}
                  selectsStart
                  startDate={start || undefined}
                  endDate={end || undefined}
                  placeholderText="Tanggal mulai"
                  className="w-full"
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
                  className="w-full"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => { setStart(null); setEnd(null); }}
            className="btn-secondary px-4 py-2 mt-6"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Scrollable Chat History */}
      <div className="flex-1 scrollable-content p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner mr-3"></div>
            <span className="text-secondary">Memuat riwayat chat...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Tidak ada riwayat</h3>
            <p className="text-muted">Belum ada percakapan untuk ditampilkan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((item, idx) => (
              <div key={item.executionId + idx} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[70%] bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                    <div className="font-medium mb-1">{item.chat}</div>
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
                  <div className="max-w-[70%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="font-medium text-primary mb-2">{item.chatResponse}</div>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-muted">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Menu: {item.currentMenu}
                      </div>
                      <div className="flex items-center text-xs text-muted">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Workflow: {item.workflowName}
                      </div>
                      <a
                        href={`https://wecare.techconnect.co.id/workflow/${item.workflowId}/executions/${item.executionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        title={`workflowId: ${item.workflowId}\nname: ${item.workflowName}`}
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Lihat Execution
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