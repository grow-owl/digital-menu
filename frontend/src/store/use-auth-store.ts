import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/user.types';
import { useTableStore } from './use-table-store';
import { useCartStore } from './use-cart-store';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tableId: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, tableId?: string | null, refreshToken?: string | null) => void;
  setTokens: (token: string, refreshToken?: string | null) => void;
  setTableId: (tableId: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      tableId: null,
      isAuthenticated: false,
      setAuth: (user, token, tableId = null, refreshToken = null) =>
        set({
          user,
          token,
          refreshToken: refreshToken || null,
          tableId: tableId || null,
          isAuthenticated: true,
        }),
      setTokens: (token, refreshToken) =>
        set((state) => ({
          token,
          refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken,
        })),
      setTableId: (tableId) => set({ tableId }),
      updateUser: (user) =>
        set((state) => ({
          user: { ...state.user, ...user },
        })),
      logout: () => {
        try {
          useTableStore.getState().clearSession();
          useCartStore.getState().clearCart();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('aura_station_terminal_key');
            localStorage.removeItem('aura-table-session');
            localStorage.removeItem('aura-cart-storage');
          }
        } catch (e) {
          console.warn('Error clearing table/cart session on logout:', e);
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          tableId: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'aura-auth-storage',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.token) {
          try {
            const parts = state.token.split('.');
            if (parts.length !== 3) {
              state.logout();
              return;
            }
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            
            // Auto logout ONLY if both access token is expired AND no refresh token exists
            if (payload.exp && Date.now() >= payload.exp * 1000) {
              if (!state.refreshToken) {
                state.logout();
                return;
              }
            }

            // Anti-Tamper: Force role from cryptographically signed JWT payload
            if (payload.role && state.user && state.user.role !== payload.role) {
              state.user.role = payload.role;
            }
          } catch {
            if (!state.refreshToken) {
              state.logout();
            }
          }
        }
      },
    }
  )
);

