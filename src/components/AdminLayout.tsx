'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

interface NavMenuItem {
  id: string;
  title: string;
  href: string;
  icon: string;
  color: string;
  requiredRole?: string; // Optional role requirement
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title = "Admin Panel", 
  subtitle = "Kelola sistem dan database" 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, logout } = useAuth();

  // Get user role from auth context
  const userRole = user?.role || null;

  // Filter menu items based on user role
  const getFilteredMenuItems = (role: string | null): NavMenuItem[] => {
    const allMenuItems: NavMenuItem[] = [
      {
        id: "dashboard",
        title: "Dashboard Chat",
        href: "/dashboard",
        icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z",
        color: "bg-blue-500 hover:bg-blue-600"
      },
      {
        id: "mapping-cc-benefit",
        title: "Mapping CC Benefit",
        href: "/admin/mapping-cc-benefit",
        icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
        color: "bg-green-500 hover:bg-green-600",
        requiredRole: 'admin' // Only admin can see this
      },
      {
        id: "mapping-cc-pp",
        title: "Mapping CC PP",
        href: "/admin/mapping-cc-pp",
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "bg-purple-500 hover:bg-purple-600",
        requiredRole: 'admin' // Only admin can see this
      },
      {
        id: "menu-master",
        title: "Menu Master",
        href: "/admin/menu-master",
        icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
        color: "bg-orange-500 hover:bg-orange-600",
        requiredRole: 'admin' // Only admin can see this
      },
      {
        id: "knowledge-benefit-menu",
        title: "Knowledge Benefit Menu",
        href: "/admin/knowledge-benefit-menu",
        icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
        color: "bg-indigo-500 hover:bg-indigo-600",
        requiredRole: 'admin' // Only admin can see this
      }
    ];

    // Filter items based on user role
    return allMenuItems.filter(item => {
      // If item doesn't have requiredRole, show to everyone
      if (!item.requiredRole) return true;
      // If user role matches required role, show the item
      return role === item.requiredRole;
    });
  };

  // Get filtered menu items based on current user role
  const navMenuItems: NavMenuItem[] = getFilteredMenuItems(userRole);

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleLogout = () => {
    logout();
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header with Navigation */}
      <div style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }} className="shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Main Header Row */}
          <div className="flex items-center py-4 sm:py-6">
            {/* Logo and Title */}
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => router.push("/admin")}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 hover:bg-blue-700 transition-colors"
                title="Back to Admin Main Page"
              >
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </h1>
                <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                  {subtitle}
                </p>
              </div>
            </div>
            
            {/* Action Buttons Group */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Back to Main Button - Only show on sub-pages, not on main admin page */}
              {pathname !== '/admin' && (
                <button
                  onClick={() => router.push("/admin")}
                  className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back to Main</span>
                  <span className="sm:hidden">Back</span>
                </button>
              )}
              
              {/* Theme Toggle - Hidden on mobile, available in mobile menu */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              
              {/* Logout Button - Hidden on mobile, available in mobile menu */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Navigation Menu Bar - Desktop and Tablet */}
          <div className="border-t hidden sm:block" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex flex-wrap gap-1 sm:gap-2 py-3 sm:py-4">
              {navMenuItems.map((item) => {
                const isActive = isActiveRoute(item.href);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                    style={!isActive ? { color: 'var(--text-secondary)' } : {}}
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center mr-2 ${
                      isActive ? 'bg-blue-600 text-white' : item.color
                    }`}>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                    {item.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Navigation - Hamburger Menu */}
          <div className="border-t sm:hidden" style={{ borderColor: 'var(--border-color)' }}>
            <div className="py-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  Navigation Menu
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Mobile Menu Items */}
              {isMobileMenuOpen && (
                <div className="mt-2 pb-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="mobile-nav-menu flex flex-col gap-1 pt-2">
                    {/* Navigation Items */}
                    {navMenuItems.map((item) => {
                      const isActive = isActiveRoute(item.href);
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleNavigation(item.href);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`mobile-nav-item flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-2 ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          }`}
                          style={!isActive ? { color: 'var(--text-secondary)' } : {}}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 ${
                            isActive ? 'bg-blue-600 text-white' : item.color
                          }`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                          </div>
                          {item.title}
                        </button>
                      );
                    })}
                    
                    {/* Mobile Theme Toggle and Logout - Only visible on mobile */}
                    <div className="border-t pt-2 mt-2 mx-2" style={{ borderColor: 'var(--border-color)' }}>
                      {/* Theme Toggle in Mobile Menu */}
                      <div className="px-4 py-3">
                        <div className="flex items-center mb-2">
                          <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2M9 3h2a2 2 0 012 2v12a4 4 0 01-2 2H9m6-16a2 2 0 012-2h2a2 2 0 012 2v12a4 4 0 01-4 4h-2a2 2 0 01-2-2V5z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Theme</span>
                        </div>
                        <div className="ml-8">
                          <ThemeToggle />
                        </div>
                      </div>
                      
                      {/* Logout Button in Mobile Menu */}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="mobile-nav-item flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <div className="w-5 h-5 rounded bg-red-600 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;