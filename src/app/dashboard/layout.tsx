"use client";
import React, { useState, useEffect } from "react";
import SidebarChatList from "@/components/SidebarChatList";
import ChatDetailPanel from "@/components/ChatDetailPanel";
import ThemeToggle from "@/components/ThemeToggle";
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
    <div className="h-screen flex flex-col md:flex-row overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Mobile Header */}
      <div className="md:hidden flex-shrink-0 border-b" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">WhatsApp Admin</h1>
              <p className="text-muted text-xs">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => router.push("/admin")}
              className="btn-secondary flex items-center px-3 py-1.5 text-sm"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Menu
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Hidden on mobile unless needed */}
      <aside className="hidden md:flex w-full md:w-80 lg:w-96 h-full shadow-lg flex-col overflow-hidden" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
        {/* Desktop Header */}
        <div className="p-4 lg:p-6 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-2 lg:mr-3">
                <svg className="w-4 h-4 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-primary">WhatsApp Admin</h1>
                <p className="text-muted text-xs lg:text-sm">Dashboard</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scrollable Chat List */}
        <div className="flex-1 overflow-hidden">
          <SidebarChatList onSelect={setSelectedNohp} selectedNohp={selectedNohp} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:block border-b px-4 lg:px-6 py-3 lg:py-4 shadow-sm flex-shrink-0" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base lg:text-lg font-semibold text-primary">
                {selectedNohp ? `Chat: ${selectedNohp}` : 'Pilih chat untuk mulai'}
              </h2>
              <p className="text-muted text-xs lg:text-sm">
                {selectedNohp ? 'Melihat detail percakapan' : 'Dashboard Admin WhatsApp'}
              </p>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <ThemeToggle />
              <button
                onClick={() => router.push("/admin")}
                className="btn-secondary flex items-center px-3 lg:px-4 py-1.5 lg:py-2 text-sm"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali ke Menu
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Chat Detail Panel */}
        <div className="flex-1 overflow-hidden">
          <ChatDetailPanel nohp={selectedNohp} />
        </div>
      </main>
    </div>
  );
} 