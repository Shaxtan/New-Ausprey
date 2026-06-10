import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PageLoader } from '@/components/ui';
import { useAuthStore } from '@/store';
import { PATHS } from '@/constants/paths';
import NotFound from '@/pages/NotFound';

function ProtectedRoute({ children }) {
  const ok  = useAuthStore((s) => s.isAuthenticated);
  const loc = useLocation();
  if (!ok) return <Navigate to={PATHS.LOGIN} replace state={{ from: loc }} />;
  return children;
}

function GuestRoute({ children }) {
  const ok  = useAuthStore((s) => s.isAuthenticated);
  const loc = useLocation();
  if (ok) return <Navigate to={loc.state?.from?.pathname ?? PATHS.DASHBOARD} replace />;
  return children;
}

const LoginPage       = lazy(() => import('@/modules/auth/pages/LoginPage'));
const SignupPage      = lazy(() => import('@/modules/auth/pages/SignupPage'));
const DashboardPage   = lazy(() => import('@/modules/dashboard'));
const TrackingPage    = lazy(() => import('@/modules/tracking'));
const MapPage         = lazy(() => import('@/modules/map'));
const VehiclesPage    = lazy(() => import('@/modules/vehicles'));
const TripsPage       = lazy(() => import('@/modules/trips'));
const GeofencePage    = lazy(() => import('@/modules/geofence'));
const AlertsPage      = lazy(() => import('@/modules/alerts'));
const ReportsPage     = lazy(() => import('@/modules/reports'));
const AnalyticsPage   = lazy(() => import('@/modules/analytics'));
const DevicesPage     = lazy(() => import('@/modules/devices'));
const LoadCellPage    = lazy(() => import('@/modules/devices/pages/LoadCellReportPage'));
const LiveLoadPage    = lazy(() => import('@/modules/devices/pages/LiveLoadPage'));
const UsersPage       = lazy(() => import('@/modules/users'));
const SettingsPage    = lazy(() => import('@/modules/settings'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={PATHS.LOGIN}  element={<GuestRoute><LoginPage  /></GuestRoute>} />
        <Route path={PATHS.SIGNUP} element={<GuestRoute><SignupPage /></GuestRoute>} />

        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index                    element={<Navigate to={PATHS.DASHBOARD} replace />} />
          <Route path={PATHS.DASHBOARD}   element={<DashboardPage  />} />
          <Route path={PATHS.TRACKING}    element={<TrackingPage   />} />
          <Route path={PATHS.MAP}         element={<MapPage        />} />
          <Route path={PATHS.VEHICLES}    element={<VehiclesPage   />} />
          <Route path={PATHS.TRIPS}       element={<TripsPage      />} />
          <Route path={PATHS.GEOFENCE}    element={<GeofencePage   />} />
          <Route path={PATHS.ALERTS}      element={<AlertsPage     />} />
          <Route path={PATHS.REPORTS}     element={<ReportsPage    />} />
          <Route path={PATHS.ANALYTICS}   element={<AnalyticsPage  />} />
          <Route path={PATHS.DEVICES}     element={<DevicesPage    />} />
          <Route path={PATHS.LOAD_CELL}   element={<LoadCellPage   />} />
          <Route path={PATHS.LIVE_LOAD}   element={<LiveLoadPage   />} />
          <Route path={PATHS.USERS}       element={<UsersPage      />} />
          <Route path={PATHS.SETTINGS}    element={<SettingsPage   />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}