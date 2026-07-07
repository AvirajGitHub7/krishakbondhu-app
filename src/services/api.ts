/**
 * KrishakBondhu - API Client
 * Axios instance with JWT interceptor for authenticated API calls.
 */

import axios from 'axios';
import { API_URL } from '@/constants/config';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor — attach JWT token and set Content-Type dynamically
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — force logout
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
