import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PATHS } from '@/constants';
import NotFound from '@/pages/NotFound';

// Feature modules are code-split. Each module exposes its page via index.js.
const DashboardPage = lazy(() => import('@/modules/dashboard'));
const TrackingPage = lazy(() => import('@/modules/tracking'));
const VehiclesPage = lazy(() => import('@/modules/vehicles'));
const GeofencePage = lazy(() => import('@/modules/geofence'));
const AlertsPage = lazy(() => import('@/modules/alerts'));
const ReportsPage = lazy(() => import('@/modules/reports'));
const AnalyticsPage = lazy(() => import('@/modules/analytics'));
const DevicesPage = lazy(() => import('@/modules/devices'));
const UsersPage = lazy(() => import('@/modules/users'));
const SettingsPage = lazy(() => import('@/modules/settings'));

export function AppRoutes() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={PATHS.DASHBOARD} replace />} />
        <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />
        <Route path={PATHS.TRACKING} element={<TrackingPage />} />
        <Route path={PATHS.VEHICLES} element={<VehiclesPage />} />
        <Route path={PATHS.GEOFENCE} element={<GeofencePage />} />
        <Route path={PATHS.ALERTS} element={<AlertsPage />} />
        <Route path={PATHS.REPORTS} element={<ReportsPage />} />
        <Route path={PATHS.ANALYTICS} element={<AnalyticsPage />} />
        <Route path={PATHS.DEVICES} element={<DevicesPage />} />
        <Route path={PATHS.USERS} element={<UsersPage />} />
        <Route path={PATHS.SETTINGS} element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
