"use client";
import React, { useEffect, useState } from "react";
import api from "@/utils/api";

interface ChatItem {
  nohp: string;
  name: string;
  lastMessage: string;
  lastUpdated: string;
}

interface SidebarChatListProps {
  onSelect: (nohp: string) => void;
  selectedNohp: string | null;
}

export default function SidebarChatList({ onSelect, selectedNohp }: SidebarChatListProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/chat/active");
        // Mapping snake_case ke camelCase
        const mapped = res.data.map((item: any) => ({
          nohp: item.nohp,
          name: item.chatname, // ambil dari chatname
          lastMessage: item.lastmessage, // ambil dari lastmessage
          lastUpdated: item.lastupdated, // ambil dari lastupdated
        }));
        setChats(mapped);
      } catch {
        setChats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  const filtered = chats.filter(
    c =>
      c.nohp.includes(search) ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Search Input */}
      <div className="p-6 pb-4 flex-shrink-0 bg-white dark:bg-gray-800">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama/nomor HP..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable Chat List */}
      <div className="flex-1 scrollable-content px-6 pb-6">
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner mr-3"></div>
              <span className="text-secondary">Memuat chat...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-muted font-medium">Tidak ada chat aktif</p>
              <p className="text-muted text-sm mt-1">Chat akan muncul di sini</p>
            </div>
          ) : (
            filtered.map(chat => (
              <div
                key={chat.nohp}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                  selectedNohp === chat.nohp 
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-sm" 
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                onClick={() => onSelect(chat.nohp)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-primary font-semibold truncate">
                          {chat.name || chat.nohp}
                        </h3>
                        <p className="text-secondary text-sm truncate">
                          {chat.lastMessage || "Tidak ada pesan"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-muted text-xs">
                      {chat.lastUpdated ? new Date(String(chat.lastUpdated)).toLocaleString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 