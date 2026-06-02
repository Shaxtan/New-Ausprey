import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui';
import { PATHS } from '@/constants';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-primary-soft">
        <Compass size={30} className="text-primary" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Page not found</h1>
      <p className="text-slate-500 max-w-sm mb-6">The page you’re looking for doesn’t exist or has moved.</p>
      <Link to={PATHS.DASHBOARD}><Button>Back to Dashboard</Button></Link>
    </div>
  );
}
