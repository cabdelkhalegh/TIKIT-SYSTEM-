import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthStore, User } from '@/types/auth.types';
import { apiClient } from '@/lib/api-client';

// Helper to sync auth state to a cookie so Next.js middleware can read it
function syncAuthCookie(token: string | null, isAuthenticated: boolean) {
  if (typeof document === 'undefined') return;
  if (token && isAuthenticated) {
    const cookieValue = JSON.stringify({ state: { token, isAuthenticated } });
    document.cookie = `tikit-auth-storage=${encodeURIComponent(cookieValue)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
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
        // Set token in API client headers
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Sync to cookie for middleware
        syncAuthCookie(token, true);
        
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Remove token from API client headers
        delete apiClient.defaults.headers.common['Authorization'];
        
        // Clear cookie
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
        // This will be called on app initialization to restore token
        const state = useAuthStore.getState();
        if (state.token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          // Ensure cookie is in sync
          syncAuthCookie(state.token, true);
        }
      },
    }),
    {
      name: 'tikit-auth-storage',
      onRehydrateStorage: () => (state) => {
        // After hydrating from localStorage, restore the auth header on the API client
        if (state?.token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          syncAuthCookie(state.token, true);
        }
      },
    }
  )
);
