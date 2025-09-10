"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/admin");
    } else {
      router.replace("/login");
    }
  }, [router, mounted]);

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
        <div className="text-center max-w-sm w-full">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-sm sm:text-base font-medium" style={{ color: '#3b82f6' }}>Memuat aplikasi...</p>
          <p className="text-xs sm:text-sm mt-2" style={{ color: '#6b7280' }}>WhatsApp Admin Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Theme Toggle positioned in top-right corner */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
        <ThemeToggle />
      </div>
      
      {/* Test theme variables card */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 p-3 sm:p-4 rounded-lg border max-w-[200px] sm:max-w-none" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm sm:text-base font-medium" style={{ color: 'var(--text-primary)' }}>Theme Test</h3>
        <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Background should change</p>
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded mt-2" style={{ backgroundColor: 'var(--primary)' }}></div>
      </div>
      
      <div className="text-center max-w-sm w-full">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-primary font-medium text-sm sm:text-base">Memuat aplikasi...</p>
        <p className="text-muted text-xs sm:text-sm mt-2">WhatsApp Admin Dashboard</p>
      </div>
    </div>
  );
}
