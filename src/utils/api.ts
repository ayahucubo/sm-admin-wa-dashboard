import axios from "axios";

// Helper function to get the correct API path based on environment
export const getApiPath = (path: string): string => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Detect environment by hostname, not NODE_ENV
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.startsWith('192.168.');
    
    // If not localhost, assume production and prepend base path
    if (!isLocalhost) {
      return `/sm-admin/${cleanPath}/`;
    }
  }
  
  // In development, use the path as-is with trailing slash
  return `/${cleanPath}/`;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://wecare.techconnect.co.id/webhook/100/app",
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor untuk better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Response Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('API Request Error:', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(config => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

export default api; 