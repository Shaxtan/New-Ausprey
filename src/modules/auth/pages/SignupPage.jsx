import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { TextField } from '@/components/forms';
import { useAuthStore } from '@/store';
import { PATHS } from '@/constants';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../components/AuthLayout';

export default function SignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({ name: '', company: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await authService.signup(form);
      login({ user, token });
      navigate(PATHS.DASHBOARD, { replace: true });
    } catch (err) {
      setError(err?.message ?? 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing your fleet in minutes."
      footer={<>Already have an account? <Link to={PATHS.LOGIN} className="font-semibold text-primary hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Full name" required placeholder="Jane Doe" value={form.name} onChange={set('name')} autoComplete="name" />
          <TextField label="Company" placeholder="Acme Logistics" value={form.company} onChange={set('company')} autoComplete="organization" />
        </div>

        <TextField label="Work email" type="email" required placeholder="you@company.com" value={form.email} onChange={set('email')} autoComplete="email" />

        <div className="relative">
          <TextField label="Password" type={showPw ? 'text' : 'password'} required placeholder="At least 6 characters"
            value={form.password} onChange={set('password')} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <TextField label="Confirm password" type={showPw ? 'text' : 'password'} required placeholder="Re-enter password"
          value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />

        <Button type="submit" size="lg" icon={UserPlus} disabled={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}