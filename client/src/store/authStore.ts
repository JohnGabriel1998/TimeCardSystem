import { create } from 'zustand';
import api from '../lib/axios';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  loadUser: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch (error) {
        // Invalid user data, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    } else {
      // No token or user data, ensure we're in logged out state
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  login: async (usernameOrEmail: string, password: string) => {
    try {
      console.log('Making login request to /api/auth/login');
      const response = await api.post('/api/auth/login', { username: usernameOrEmail, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isAuthenticated: true });
    } catch (error: any) {
      console.error('Login error details:', error.response?.data || error.message);
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/register', { username, email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isAuthenticated: true });
    } catch (error: any) {
      console.error('Registration error details:', error.response?.data || error.message);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

// Initialize auth state
useAuthStore.getState().loadUser();