import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthStore, User } from '@/types/auth.types';
import { apiClient } from '@/lib/api-client';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (token: string, user: User) => {
        // Set token in API client headers
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Remove token from API client headers
        delete apiClient.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      initialize: () => {
        // This will be called on app initialization to restore token
        const state = useAuthStore.getState();
        if (state.token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }),
    {
      name: 'tikit-auth-storage',
    }
  )
);
