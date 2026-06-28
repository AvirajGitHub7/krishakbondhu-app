/**
 * KrishakBondhu - Auth API Service
 */

import api from './api';
import { TokenResponse, User } from '@/types';

export const authService = {
  register: async (data: { name: string; email: string; password: string; phone?: string; location?: string }): Promise<TokenResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<TokenResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User> & { avatar_base64?: string }): Promise<User> => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },
};
