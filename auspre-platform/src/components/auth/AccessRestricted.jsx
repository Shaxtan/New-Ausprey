import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { PATHS } from '@/constants';

export function AccessRestricted({ requiredRole = 'Super Admin' }) {
  const navigate = useNavigate();

  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
          <ShieldAlert size={26} className="text-rose-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Access Restricted</h3>
        <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
          This page is only available to {requiredRole}s. Contact your administrator if you believe you should have access.
        </p>
        <button
          onClick={() => navigate(PATHS.DASHBOARD)}
          className="mt-6 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover transition"
        >
          Back to Dashboard
        </button>
      </div>
    </Card>
  );
}

export default AccessRestricted;