import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthStore, User } from '@/types/auth.types';
import { apiClient } from '@/lib/api-client';

const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// Helper to set the auth header on the API client
function setAuthHeader(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

// Helper to sync auth state to a cookie so Next.js middleware can read it
function syncAuthCookie(token: string | null, isAuthenticated: boolean) {
  if (typeof document === 'undefined') return;
  if (token && isAuthenticated) {
    const cookieValue = JSON.stringify({ state: { token, isAuthenticated } });
    document.cookie = `tikit-auth-storage=${encodeURIComponent(cookieValue)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax`;
  } else {
    document.cookie = 'tikit-auth-storage=; path=/; max-age=0';
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (token: string, user: User) => {
        setAuthHeader(token);
        syncAuthCookie(token, true);
        
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        setAuthHeader(null);
        syncAuthCookie(null, false);
        
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
        const state = useAuthStore.getState();
        if (state.token) {
          setAuthHeader(state.token);
          syncAuthCookie(state.token, true);
        }
      },
    }),
    {
      name: 'tikit-auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAuthHeader(state.token);
          syncAuthCookie(state.token, true);
        }
      },
    }
  )
);
