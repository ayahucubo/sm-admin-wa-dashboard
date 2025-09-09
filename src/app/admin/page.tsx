"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

interface MenuCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isPdfToMdRunning, setIsPdfToMdRunning] = useState(false);
  const [isMdToVectorRunning, setIsMdToVectorRunning] = useState(false);

  // Function to trigger PDF to MD pipeline
  const triggerPdfToMdPipeline = async () => {
    try {
      setIsPdfToMdRunning(true);
      
      console.log('Starting PDF to MD pipeline...');
      
      const response = await fetch('/api/pdf-to-md-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger: 'manual',
          timestamp: new Date().toISOString(),
          source: 'admin-dashboard'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('PDF to MD pipeline started successfully:', result);
        alert('PDF to MD pipeline started successfully!\n\nThe pipeline will:\n1. Process PDF documents\n2. Convert them to Markdown format\n3. Store the converted files');
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error starting PDF to MD pipeline:', error);
      alert(`Failed to start PDF to MD pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPdfToMdRunning(false);
    }
  };

  // Function to trigger MD to Vector pipeline
  const triggerMdToVectorPipeline = async () => {
    try {
      setIsMdToVectorRunning(true);
      
      console.log('Starting MD to Vector pipeline...');
      
      const response = await fetch('/api/md-to-vector-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger: 'manual',
          timestamp: new Date().toISOString(),
          source: 'admin-dashboard'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('MD to Vector pipeline started successfully:', result);
        alert('MD to Vector pipeline started successfully!\n\nThe pipeline will:\n1. Process Markdown files\n2. Convert them to vector embeddings\n3. Store the vectors in the database');
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error starting MD to Vector pipeline:', error);
      alert(`Failed to start MD to Vector pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMdToVectorRunning(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  const menuItems: MenuCard[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Akses dashboard WhatsApp Admin untuk mekses setiap workflow yang terjadi pada setiap chat",
      icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z",
      href: "/dashboard",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      id: "mapping-cc-benefit",
      title: "Mapping CC Benefit",
      description: "Kelola data mapping Company Code untuk benefit",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      href: "/admin/mapping-cc-benefit",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      id: "mapping-cc-pp",
      title: "Mapping CC PP",
      description: "Kelola data mapping Company Code untuk Peraturan Perusahaan",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      href: "/admin/mapping-cc-pp",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      id: "menu-master",
      title: "Menu Master",
      description: "Kelola data master menu dan konfigurasi sistem",
      icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
      href: "/admin/menu-master",
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  const handleMenuClick = (href: string) => {
    router.push(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-primary font-medium">Memuat menu admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }} className="shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Panel</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kelola sistem dan database</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={triggerPdfToMdPipeline}
                disabled={isPdfToMdRunning || isMdToVectorRunning}
                className={`px-4 py-2 text-white rounded-lg transition-colors duration-200 flex items-center ${
                  isPdfToMdRunning || isMdToVectorRunning
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isPdfToMdRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Running PDF to MD...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Convert PDF to MD
                  </>
                )}
              </button>
              <button
                onClick={triggerMdToVectorPipeline}
                disabled={isPdfToMdRunning || isMdToVectorRunning}
                className={`px-4 py-2 text-white rounded-lg transition-colors duration-200 flex items-center ${
                  isPdfToMdRunning || isMdToVectorRunning
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isMdToVectorRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Running MD to Vector...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Convert MD to Vector
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  router.replace("/login");
                }}
                className="px-4 py-2 text-sm font-medium transition-colors duration-200"
                style={{ color: 'var(--text-secondary)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Pilih Menu Admin
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Akses berbagai fitur admin untuk mengelola sistem dan database
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMenuClick(item.href)}
              className="rounded-xl shadow-sm border p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 group"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)' 
              }}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {item.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Statistik Sistem
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chat Aktif</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">0</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CC Benefit</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">0</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CC PP</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">0</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Menu Master</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
