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
    return <div className="flex-1 flex items-center justify-center text-gray-400">Pilih chat untuk melihat detail</div>;
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-4 mb-4">
        <DatePicker
          selected={start}
          onChange={date => setStart(date)}
          selectsStart
          startDate={start || undefined}
          endDate={end || undefined}
          placeholderText="Tanggal mulai"
          className="border px-2 py-1 rounded"
          dateFormat="yyyy-MM-dd"
        />
        <DatePicker
          selected={end}
          onChange={date => setEnd(date)}
          selectsEnd
          startDate={start || undefined}
          endDate={end || undefined}
          minDate={start || undefined}
          placeholderText="Tanggal akhir"
          className="border px-2 py-1 rounded"
          dateFormat="yyyy-MM-dd"
        />
      </div>
      <div className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div>Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-gray-400">Tidak ada riwayat chat</div>
        ) : (
          history.map((item, idx) => (
            <div key={item.executionId + idx} className="flex flex-col gap-1 group">
              {/* User chat bubble */}
              <div className="self-end max-w-[70%] bg-green-100 rounded-lg px-4 py-2 shadow relative">
                <div className="font-medium">{item.chat}</div>
                <div className="text-xs text-gray-500 text-right">{new Date(item.startedAt).toLocaleString()}</div>
                <div className="absolute top-1 right-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                  Menu: {item.currentMenu}
                </div>
              </div>
              {/* Bot response bubble */}
              <div className="self-start max-w-[70%] bg-white border rounded-lg px-4 py-2 shadow relative">
                <div className="font-medium">{item.chatResponse}</div>
                <div className="text-xs text-gray-500 text-right">{item.workflowName}</div>
                <a
                  href={`https://wecare.techconnect.co.id/workflow/${item.workflowId}/executions/${item.executionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline"
                  title={`workflowId: ${item.workflowId}\nname: ${item.workflowName}`}
                >
                  Execution: {item.executionId}
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 