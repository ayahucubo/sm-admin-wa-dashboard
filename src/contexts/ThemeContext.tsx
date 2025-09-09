'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light'); // Default to light
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Apply initial theme class immediately
  useEffect(() => {
    // Apply light theme initially to prevent flash
    document.documentElement.classList.add('light');
  }, []);

  // Load theme from localStorage after component mounts
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme') as Theme;
    console.log('Stored theme:', storedTheme);
    
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setTheme(storedTheme);
    } else {
      // Check system preference if no stored theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('System prefers dark:', prefersDark);
      setTheme('system');
      setActualTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Update actual theme when theme changes
  useEffect(() => {
    if (!mounted) return;

    const updateActualTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setActualTheme(systemTheme);
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateActualTheme);
      return () => mediaQuery.removeEventListener('change', updateActualTheme);
    }
  }, [theme, mounted]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove('dark', 'light');
    
    // Add the appropriate class
    root.classList.add(actualTheme);
    
    // Force a repaint by temporarily changing a style
    root.style.visibility = 'hidden';
    root.offsetHeight; // Trigger a reflow
    root.style.visibility = 'visible';
    
    // Debug logging
    console.log('Theme applied:', actualTheme, 'HTML classes:', root.classList.toString());
  }, [actualTheme, mounted]);

  const handleSetTheme = (newTheme: Theme) => {
    console.log('Setting theme to:', newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a fallback instead of throwing an error during SSR
    if (typeof window === 'undefined') {
      return {
        theme: 'light' as Theme,
        setTheme: () => {},
        actualTheme: 'light' as const
      };
    }
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}