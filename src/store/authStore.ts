/**
 * KrishakBondhu - Zustand Auth Store
 * Manages authentication state with SecureStore persistence.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false,

  setAuth: async (user: User, token: string) => {
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userStr = await SecureStore.getItemAsync('auth_user');
      const onboardingCompleted = await SecureStore.getItemAsync('onboarding_completed');

      const hasCompletedOnboarding = onboardingCompleted === 'true';

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true, isLoading: false, hasCompletedOnboarding });
      } else {
        set({ isLoading: false, hasCompletedOnboarding });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  completeOnboarding: async () => {
    await SecureStore.setItemAsync('onboarding_completed', 'true');
    set({ hasCompletedOnboarding: true });
  },

  updateUser: async (user: User) => {
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ user });
  },
}));
