import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Eye, EyeOff, LogIn, ShieldCheck, X } from 'lucide-react';
import { PATHS } from '@/constants';
import { useAuthStore } from '@/store';
import { authService } from '../services/auth.service';

export default function LoginModal({ open, onClose }) {
  const navigate = useNavigate();
  const login    = useAuthStore((s) => s.login);

  const [form, setForm]       = useState({ identifier: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Escape key + body scroll lock
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      window.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Reset on close
  useEffect(() => {
    if (!open) { setForm({ identifier: '', password: '' }); setError(''); setShowPwd(false); }
  }, [open]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, token } = await authService.login(form);
      login({ user, token });
      onClose();
      navigate(PATHS.DASHBOARD, { replace: true });
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal card — explicitly resets text color so it never inherits
              the dark-page "text-white" set on the LandingPage root wrapper */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md text-slate-900"
          >
            <div className="rounded-[28px] border border-white/60 bg-white p-10 shadow-[0_32px_80px_rgba(15,23,42,.28)]">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

              {/* Heading */}
              <h2 className="text-[2rem] font-black tracking-tight text-slate-900">Welcome Back</h2>
              <p className="mt-2 text-slate-500">Sign in to continue to your Auspre Fleet Platform.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* Error banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-red-700"
                  >
                    <AlertCircle size={18} className="shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                  </motion.div>
                )}

                {/* Username / email */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    value={form.identifier}
                    onChange={set('identifier')}
                    placeholder="Enter your username or email"
                    required
                    autoFocus
                    autoComplete="username"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-12 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-primary"
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember + forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer select-none items-center gap-2.5">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary transition hover:text-primary-hover"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-base font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-xs uppercase tracking-widest text-slate-400">
                      Secure Login
                    </span>
                  </div>
                </div>

                {/* Security badge */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                      <ShieldCheck size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Enterprise Grade Security</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        Protected with encrypted authentication, secure session management and
                        enterprise-grade security standards.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}