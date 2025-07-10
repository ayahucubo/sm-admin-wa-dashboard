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
        router.push(`${basePath}/dashboard`);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <div className="mb-4">
          <label className="block mb-1 text-gray-700">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-700">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
} 