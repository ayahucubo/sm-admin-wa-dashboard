"use client";
import React, { useState, useEffect } from "react";
import SidebarChatList from "@/components/SidebarChatList";
import ChatDetailPanel from "@/components/ChatDetailPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [selectedNohp, setSelectedNohp] = useState<string | null>(null);
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Fixed Sidebar - Never moves */}
      <aside className="w-80 sidebar h-full shadow-lg flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">WhatsApp Admin</h1>
                <p className="text-muted text-sm">Dashboard</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scrollable Chat List - Only this part scrolls */}
        <div className="flex-1 overflow-hidden">
          <SidebarChatList onSelect={setSelectedNohp} selectedNohp={selectedNohp} />
        </div>
      </aside>

      {/* Main Content - Independent scrolling */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">
                {selectedNohp ? `Chat: ${selectedNohp}` : 'Pilih chat untuk mulai'}
              </h2>
              <p className="text-muted text-sm">
                {selectedNohp ? 'Melihat detail percakapan' : 'Dashboard Admin WhatsApp'}
              </p>
            </div>
            <button
              onClick={logout}
              className="btn-secondary flex items-center px-4 py-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable Chat Detail Panel - Only this part scrolls */}
        <div className="flex-1 overflow-hidden">
          <ChatDetailPanel nohp={selectedNohp} />
        </div>
      </main>
    </div>
  );
} 