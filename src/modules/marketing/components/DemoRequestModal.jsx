import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, X } from 'lucide-react';

/**
 * ─────────────────────────────────────────────────────────────────────
 * IMPORTANT — READ BEFORE GOING LIVE
 * ─────────────────────────────────────────────────────────────────────
 * This is a frontend-only React app. There is no backend here that can
 * receive this form and email it to info@auspreytech.com — submitting
 * right now will fail until you wire ONE of these:
 *
 * OPTION A (fastest, no backend code — recommended):
 *   1. Sign up free at https://formspree.io
 *   2. Create a new form, set its destination to info@auspreytech.com
 *   3. Copy the form ID it gives you (looks like "mzbqwxyz")
 *   4. Replace DEMO_REQUEST_ENDPOINT below with:
 *        'https://formspree.io/f/mzbqwxyz'
 *   Formspree will then email every submission straight to your inbox.
 *   (web3forms.com works the same way if you'd rather use that.)
 *
 * OPTION B: point DEMO_REQUEST_ENDPOINT at your own backend route that
 *   sends mail via SendGrid / AWS SES / nodemailer / etc.
 * ─────────────────────────────────────────────────────────────────────
 */
const DEMO_REQUEST_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

const FLEET_SIZES = ['Under 10 vehicles', '10–50 vehicles', '51–200 vehicles', '200+ vehicles'];

export default function DemoRequestModal({ open, onClose }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', fleetSize: '', message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Escape key + body scroll lock — same convention as LoginModal
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
    if (!open) {
      setForm({ name: '', email: '', phone: '', company: '', fleetSize: '', message: '' });
      setError('');
      setSubmitted(false);
    }
  }, [open]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(DEMO_REQUEST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `Demo request — ${form.company || form.name}`,
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          fleetSize: form.fleetSize,
          message: form.message,
        }),
      });
      if (!res.ok) throw new Error('Submission failed. Please try again.');
      setSubmitted(true);
    } catch (err) {
      setError(
        err?.message ||
        'Unable to send your request right now. Please try again, or email us directly at info@auspreytech.com.'
      );
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal card — text-slate-900 reset so nothing inherits the
              dark landing-page text color that wraps this component. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-lg text-slate-900"
          >
            <div className="rounded-[28px] border border-white/60 bg-white p-10 shadow-[0_32px_80px_rgba(15,23,42,.28)]">
              <button
                onClick={onClose}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

              {submitted ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 size={28} className="text-emerald-500" />
                  </div>
                  <h2 className="text-[1.6rem] font-black tracking-tight text-slate-900">
                    Request received
                  </h2>
                  <p className="mt-2 max-w-xs text-slate-500">
                    Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''} — our team will reach
                    out to {form.email || 'you'} shortly to schedule your demo.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-7 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-[1.9rem] font-black tracking-tight text-slate-900">
                    Request a Demo
                  </h2>
                  <p className="mt-2 text-slate-500">
                    Tell us about your fleet and we'll set up a walkthrough tailored to your operation.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-red-700"
                      >
                        <AlertCircle size={18} className="shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Full name</label>
                        <input
                          required value={form.name} onChange={set('name')} autoFocus
                          placeholder="Jane Doe"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Work email</label>
                        <input
                          required type="email" value={form.email} onChange={set('email')}
                          placeholder="jane@company.com"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Company name</label>
                        <input
                          required value={form.company} onChange={set('company')}
                          placeholder="Your company"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Phone (optional)</label>
                        <input
                          type="tel" value={form.phone} onChange={set('phone')}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Fleet size</label>
                      <select
                        required value={form.fleetSize} onChange={set('fleetSize')}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                      >
                        <option value="" disabled>Select fleet size</option>
                        {FLEET_SIZES.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">
                        What are you looking to solve? <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <textarea
                        rows={3} value={form.message} onChange={set('message')}
                        placeholder="e.g. real-time tracking, load monitoring, fuel theft alerts..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-gold to-amber-500 text-base font-bold text-white shadow-xl shadow-amber-900/20 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {loading ? (
                        <>
                          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Request <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                      Or email us directly at{' '}
                      <a href="mailto:info@auspreytech.com" className="font-semibold text-slate-600 underline">
                        info@auspreytech.com
                      </a>
                    </p>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}