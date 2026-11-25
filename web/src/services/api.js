import axios from 'axios';

const BACKEND_URL = 'https://skillswap-ud11.onrender.com';
const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? '/api'
  : `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: automatically inject JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skillswap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is invalid or expired, clear storage
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('skillswap_token');
        localStorage.removeItem('skillswap_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

