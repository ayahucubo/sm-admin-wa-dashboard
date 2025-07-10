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
    <div className="p-4">
      <input
        type="text"
        placeholder="Cari nama/nomor HP..."
        className="w-full mb-4 px-3 py-2 border rounded focus:outline-none"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="space-y-2">
        {loading ? (
          <div>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-400">Tidak ada chat aktif</div>
        ) : (
          filtered.map(chat => (
            <div
              key={chat.nohp}
              className={`p-3 rounded cursor-pointer hover:bg-blue-50 transition border ${selectedNohp === chat.nohp ? "bg-blue-100 border-blue-400" : "bg-white border-transparent"}`}
              onClick={() => onSelect(chat.nohp)}
            >
              <div className="font-semibold">{chat.name || chat.nohp}</div>
              <div className="text-sm text-gray-500 truncate">{chat.lastMessage}</div>
              <div className="text-xs text-gray-400 text-right">
                {chat.lastUpdated ? new Date(String(chat.lastUpdated)).toLocaleString() : "-"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 