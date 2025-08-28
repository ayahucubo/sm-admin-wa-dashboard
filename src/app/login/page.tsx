"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.replace("/dashboard");
  }, [router]);

  function getBasePath() {
    if (typeof window !== "undefined") {
      const pathArr = window.location.pathname.split('/');
      if (pathArr.length <= 2) return "";
      return "/" + pathArr[1];
    }
    return "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/login", { email, password });
      if (res.data && res.data.success && res.data.token) {
        localStorage.setItem("token", res.data.token);
        const basePath = getBasePath();
        router.push("/dashboard");
      } else {
        setError(res.data?.message || "Login gagal: token tidak ditemukan.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || "Login gagal";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">Admin Login</h1>
            <p className="text-secondary">Masuk ke dashboard admin</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-secondary font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                required
              />
            </div>
            
            <div>
              <label className="block text-secondary font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-600 font-medium text-sm">{error}</p>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Memproses...
                </div>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-muted text-sm">
              Sistem Admin Dashboard WhatsApp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 