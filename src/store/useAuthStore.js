import { create } from 'zustand';

const load = () => {
  try { return JSON.parse(localStorage.getItem('auspre-auth') || '{}'); }
  catch { return {}; }
};

const stored = load();

export const useAuthStore = create((set) => ({
  user:            stored.user            ?? null,
  token:           stored.token           ?? null,
  isAuthenticated: stored.isAuthenticated ?? false,

  login: ({ user, token }) => {
    try {
      localStorage.setItem('auspre-auth', JSON.stringify({ user, token, isAuthenticated: true }));
      if (token) localStorage.setItem('auspre-token', token);
    } catch { /* noop */ }
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),

  logout: () => {
    try {
      localStorage.removeItem('auspre-auth');
      localStorage.removeItem('auspre-token');
    } catch { /* noop */ }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;