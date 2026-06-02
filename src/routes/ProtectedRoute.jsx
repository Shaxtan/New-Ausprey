import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { PATHS } from '@/constants';

export function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  }
  return children;
}

export default ProtectedRoute;