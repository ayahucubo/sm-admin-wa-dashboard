'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <motion.div 
        className="w-[200px] h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="animate-pulse h-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </motion.div>
    );
  }

  return <ThemeToggleInner />;
};

const ThemeToggleInner: React.FC = () => {
  const { theme, setTheme, actualTheme } = useTheme();

  const themes = [
    { value: 'light' as const, label: 'Light', icon: '☀️' },
    { value: 'dark' as const, label: 'Dark', icon: '🌙' },
    { value: 'system' as const, label: 'System', icon: '💻' },
  ];

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    console.log('Theme button clicked:', newTheme);
    setTheme(newTheme);
  };

  return (
    <motion.div 
      className="relative inline-block"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <motion.div 
        className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {themes.map((themeOption, index) => (
          <motion.button
            key={themeOption.value}
            onClick={() => handleThemeChange(themeOption.value)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative overflow-hidden
              ${
                theme === themeOption.value
                  ? 'text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            title={`Switch to ${themeOption.label} theme`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Background animation for active theme */}
            <AnimatePresence>
              {theme === themeOption.value && (
                <motion.div
                  className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md"
                  layoutId="activeTheme"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </AnimatePresence>
            
            <motion.span 
              className="text-base relative z-10"
              animate={{ 
                rotate: theme === themeOption.value ? [0, 15, -15, 0] : 0,
                scale: theme === themeOption.value ? [1, 1.2, 1] : 1
              }}
              transition={{ 
                duration: 0.5,
                ease: "easeInOut"
              }}
            >
              {themeOption.icon}
            </motion.span>
            <span className="hidden sm:inline relative z-10">{themeOption.label}</span>
          </motion.button>
        ))}
      </motion.div>
      
      {/* Current theme indicator with pulse animation */}
      <motion.div 
        className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <motion.div 
          className="w-2 h-2 rounded-full bg-white"
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default ThemeToggle;