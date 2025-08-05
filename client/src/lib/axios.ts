import axios from 'axios';

// Create axios instance
const api = axios.create();

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token might be expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Force a page reload to reset the entire app state
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
