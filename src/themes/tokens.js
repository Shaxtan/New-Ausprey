// Single source of truth for the design system.
// Consumed by tailwind.config.js (compile time) and charts/components (runtime).
export const tokens = {
  colors: {
    sidebar: { DEFAULT: '#0e1a30', soft: '#16243d', line: '#1e3050', text: '#94a8c6', muted: '#64789a' },
    brand: { gold: '#d29a4a', red: '#e0533a' },
    primary: { DEFAULT: '#2563eb', hover: '#1d4ed8', soft: '#eff6ff' },
  },
  status: {
    moving: '#10b981', stopped: '#f59e0b', inactive: '#cbd5e1',
    online: '#10b981', idle: '#f59e0b', offline: '#94a3b8',
    success: '#059669', danger: '#e11d48',
  },
  chart: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#0ea5e9', '#14b8a6', '#94a3b8'],
  typography: {
    sizes: {
      '2xs': ['0.625rem', { lineHeight: '0.85rem' }],
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['0.9375rem', { lineHeight: '1.5rem' }],
      lg: ['1.0625rem', { lineHeight: '1.6rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    },
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 18 },
  layout: { sidebarWidth: 240, sidebarCollapsed: 76, topbarHeight: 68 },
};

export default tokens;
