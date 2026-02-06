import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { AuthStore, User } from '@/types/auth.types';
import { apiClient } from '@/lib/api-client';

// Custom storage that syncs to both localStorage and cookies
// Note: Cookies are not httpOnly because client-side JavaScript needs access
// for Zustand state management. For production, consider implementing server-side
// session management with httpOnly cookies for enhanced security.
const cookieStorage: StateStorage = {
  getItem: (name: string): string | null => {
    // Try to get from cookies first (server-side accessible)
    const cookieValue = Cookies.get(name);
    if (cookieValue) {
      return cookieValue;
    }
    // Fallback to localStorage (client-side only)
    if (typeof window !== 'undefined') {
      return localStorage.getItem(name);
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    // Set in both localStorage and cookies
    if (typeof window !== 'undefined') {
      localStorage.setItem(name, value);
    }
    // Set cookie with 7 days expiry
    Cookies.set(name, value, { 
      expires: 7, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  },
  removeItem: (name: string): void => {
    // Remove from both localStorage and cookies
    if (typeof window !== 'undefined') {
      localStorage.removeItem(name);
    }
    Cookies.remove(name);
  },
};

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
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);
