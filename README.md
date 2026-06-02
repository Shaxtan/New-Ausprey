# Auspre — Fleet Intelligence Platform

Enterprise IoT / fleet-tracking platform built with **Vite + React**.

## Stack
React 18 · React Router 6 · Zustand · TanStack Query · Tailwind CSS · Recharts · Framer Motion · Lucide · React-Leaflet.

## Getting started
```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:3000
npm run build        # production build
npm run preview      # preview the build
npm run lint         # eslint
```

## Architecture
```
src/
  assets/           static assets
  components/        shared library: ui · charts · tables · forms · maps · common
  layouts/           app shell (Sidebar + Topbar + DashboardLayout)
  pages/             standalone pages (NotFound)
  modules/           feature modules (each: pages · components · hooks · services · index.js)
    dashboard vehicles tracking geofence alerts reports analytics users devices settings
  services/          apiClient (axios) · queryClient (TanStack) · mockDelay
  hooks/             cross-cutting hooks
  store/             Zustand stores (UI + Auth)
  routes/            route table + guards
  utils/             cn + formatters
  constants/         paths · navigation · roles
  themes/            design tokens + typography (single source consumed by tailwind.config)
```

### Data layer
Module `*.service.js` files currently resolve mock fixtures through `services/mockDelay`.
Switching to live data is a one-line change per function (`apiClient.get('/...')`) — components and hooks stay untouched.
