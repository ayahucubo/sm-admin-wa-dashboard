"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
        <motion.div 
          className="text-center max-w-sm w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <motion.svg 
              className="w-6 h-6 sm:w-8 sm:h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </motion.svg>
          </motion.div>
          <motion.div 
            className="loading-spinner mx-auto mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          />
          <motion.p 
            className="text-sm sm:text-base font-medium" 
            style={{ color: '#3b82f6' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Memuat aplikasi...
          </motion.p>
          <motion.p 
            className="text-xs sm:text-sm mt-2" 
            style={{ color: '#6b7280' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            WhatsApp Admin Dashboard
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="min-h-screen flex items-center justify-center px-4" 
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Theme Toggle positioned in top-right corner */}
        <motion.div 
          className="absolute top-3 right-3 sm:top-4 sm:right-4"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <ThemeToggle />
        </motion.div>
        
        {/* Test theme variables card */}
        <motion.div 
          className="absolute top-3 left-3 sm:top-4 sm:left-4 p-3 sm:p-4 rounded-lg border max-w-[200px] sm:max-w-none" 
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm sm:text-base font-medium" style={{ color: 'var(--text-primary)' }}>Theme Test</h3>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Background should change</p>
          <motion.div 
            className="w-6 h-6 sm:w-8 sm:h-8 rounded mt-2" 
            style={{ backgroundColor: 'var(--primary)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: "spring" }}
          />
        </motion.div>
        
        <motion.div 
          className="text-center max-w-sm w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.2 
            }}
            whileHover={{ 
              scale: 1.1, 
              boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" 
            }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </motion.div>
          <motion.div 
            className="loading-spinner mx-auto mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          />
          <motion.p 
            className="text-primary font-medium text-sm sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Memuat aplikasi...
          </motion.p>
          <motion.p 
            className="text-muted text-xs sm:text-sm mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            WhatsApp Admin Dashboard
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
