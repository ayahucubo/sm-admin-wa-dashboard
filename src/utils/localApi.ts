import axios from "axios";

// Helper function to get the correct base URL based on environment
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    // In browser, use current origin
    const origin = window.location.origin;
    // In production, add the basePath
    if (process.env.NODE_ENV === 'production') {
      return `${origin}/sm-admin`;
    }
    return origin;
  }
  // Server-side fallback
  return '';
};

// Local API client for Next.js API routes
const localApi = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add authentication token
localApi.interceptors.request.use(config => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for better error handling
localApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Local API Response Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Local API Request Error:', error.request);
    } else {
      console.error('Local API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default localApi;