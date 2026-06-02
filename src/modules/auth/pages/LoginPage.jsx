import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { TextField } from '@/components/forms';
import { useAuthStore } from '@/store';
import { PATHS } from '@/constants';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../components/AuthLayout';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, token } = await authService.login(form);
      login({ user, token });
      navigate(location.state?.from?.pathname ?? PATHS.DASHBOARD, { replace: true });
    } catch (err) {
      setError(err?.message ?? 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Auspre fleet workspace."
      footer={<>Don’t have an account? <Link to={PATHS.SIGNUP} className="font-semibold text-primary hover:underline">Create one</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <TextField label="Email address" type="email" required placeholder="you@company.com"
          value={form.email} onChange={set('email')} autoComplete="email" />

        <div className="relative">
          <TextField label="Password" type={showPw ? 'text' : 'password'} required placeholder="••••••••"
            value={form.password} onChange={set('password')} autoComplete="current-password" />
          <button type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" /> Remember me
          </label>
          <button type="button" className="font-semibold text-primary hover:underline">Forgot password?</button>
        </div>

        <Button type="submit" size="lg" icon={LogIn} disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-center text-xs text-slate-400">Demo: any email + a 6+ character password.</p>
      </form>
    </AuthLayout>
  );
}