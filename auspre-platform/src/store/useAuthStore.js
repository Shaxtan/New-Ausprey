import { create } from 'zustand';

// Auth slice. Replace mock user with /auth/me hydration on boot.
export const useAuthStore = create((set) => ({
  user: { name: 'Admin User', role: 'Super Admin', email: 'admin@auspre.com' },
  isAuthenticated: true,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

export default useAuthStore;
