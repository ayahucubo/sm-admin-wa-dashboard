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
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-80 bg-white border-r h-screen overflow-y-auto">
        <SidebarChatList onSelect={setSelectedNohp} selectedNohp={selectedNohp} />
      </aside>
      <main className="flex-1 flex flex-col relative">
        <button
          onClick={logout}
          className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 z-10"
        >
          Logout
        </button>
        <ChatDetailPanel nohp={selectedNohp} />
      </main>
    </div>
  );
} 