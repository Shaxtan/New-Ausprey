import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { PATHS } from '@/constants';

export function GuestRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    const to = location.state?.from?.pathname ?? PATHS.DASHBOARD;
    return <Navigate to={to} replace />;
  }
  return children;
}

export default GuestRoute;