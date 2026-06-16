import { create } from 'zustand';
import type { Company } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  company: Company | null;
  token: string | null;
  isLoading: boolean;
  login: (handle: string, password: string) => Promise<void>;
  register: (handle: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  company: null,
  token: localStorage.getItem('access_token'),
  isLoading: false,

  login: async (handle, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ company_handle: handle, password });
      const token = res.data.access_token;
      localStorage.setItem('access_token', token);
      const me = await authApi.me();
      set({ token, company: me.data, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  register: async (handle, displayName, password) => {
    set({ isLoading: true });
    try {
      await authApi.register({ company_handle: handle, display_name: displayName, password });
      // auto-login after register
      const res = await authApi.login({ company_handle: handle, password });
      const token = res.data.access_token;
      localStorage.setItem('access_token', token);
      const me = await authApi.me();
      set({ token, company: me.data, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ company: null, token: null });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const me = await authApi.me();
      set({ company: me.data, token });
    } catch {
      localStorage.removeItem('access_token');
      set({ company: null, token: null });
    }
  },
}));
