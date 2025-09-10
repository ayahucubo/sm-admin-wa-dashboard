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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4 sm:gap-0">
            <div className="flex items-center w-full sm:w-auto">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>Admin Panel</h1>
                <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-muted)' }}>Kelola sistem dan database</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
              <ThemeToggle />
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  router.replace("/login");
                }}
                className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                style={{ color: 'var(--text-secondary)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Pilih Menu Admin
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            Akses berbagai fitur admin untuk mengelola sistem dan database
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMenuClick(item.href)}
              className="rounded-xl shadow-sm border p-4 sm:p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] sm:hover:scale-105 group active:scale-95"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)' 
              }}
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                    {item.description}
                  </p>
                </div>
                <div className="flex-shrink-0 hidden sm:block">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
