"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simple working home page without complex redirects
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div 
        className="max-w-md w-full mx-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            SM Admin WA Dashboard
          </h1>
          <p className="text-gray-600 mb-8">
            WhatsApp workflow management system
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/login"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login to Dashboard
            </Link>
            
            <Link 
              href="/admin"
              className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Admin Panel
            </Link>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Production Environment</p>
            <p>Status: Ready ✅</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}