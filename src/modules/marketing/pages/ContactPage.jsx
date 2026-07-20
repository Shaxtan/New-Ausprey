import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Nav, Footer, PageHero, BG, PANEL, PANEL2, KEYFRAMES, fadeUp } from '../shared';

const INFO = [
  { icon: Mail,   title: 'Email',  value: 'info@auspreytech.com' },
  { icon: Phone,  title: 'Phone',  value: '+91-124-5057262' },
  { icon: MapPin, title: 'Office', value: 'Pune, Maharashtra, India' },
];

export default function ContactPage() {
  const navigate = useNavigate();
  const openLogin = () => navigate('/login');

  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire this up to your real form-handling endpoint or email service.
    setSubmitted(true);
  };

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen text-white antialiased">
      <style>{KEYFRAMES}</style>
      <Nav onLogin={openLogin} />
      <PageHero
        eyebrow="Contact Us"
        title="Let's talk about your fleet"
        desc="Tell us a bit about your operation and we'll get back to you within one business day."
      />

      <section className="pb-24">
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-8 px-6 lg:grid-cols-[1fr_1.3fr]">
          <motion.div {...fadeUp} className="space-y-4">
            {INFO.map((i) => (
              <div key={i.title} className="flex items-start gap-3.5 rounded-2xl border border-white/8 p-5" style={{ backgroundColor: PANEL }}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(210,154,74,0.12)' }}>
                  <i.icon size={18} className="text-brand-gold" />
                </span>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">{i.title}</p>
                  <p className="mt-1 text-[14px] font-semibold text-white">{i.value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="rounded-2xl border border-white/8 p-7" style={{ backgroundColor: PANEL2 }}>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 size={40} className="mb-4 text-emerald-400" />
                <p className="text-[16px] font-bold text-white">Message received</p>
                <p className="mt-2 max-w-xs text-[13.5px] text-slate-400">
                  Thanks, {form.name.split(' ')[0] || 'there'} — our team will reach out to {form.email || 'you'} shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-bold text-slate-400">Full name</label>
                    <input required value={form.name} onChange={set('name')} placeholder="Jane Doe"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-[13.5px] text-white outline-none transition placeholder:text-slate-500 focus:border-brand-gold/50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-bold text-slate-400">Work email</label>
                    <input required type="email" value={form.email} onChange={set('email')} placeholder="jane@company.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-[13.5px] text-white outline-none transition placeholder:text-slate-500 focus:border-brand-gold/50" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-slate-400">Company</label>
                  <input value={form.company} onChange={set('company')} placeholder="Your company"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-[13.5px] text-white outline-none transition placeholder:text-slate-500 focus:border-brand-gold/50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-slate-400">Message</label>
                  <textarea required rows={4} value={form.message} onChange={set('message')} placeholder="Tell us about your fleet size and what you're looking for..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-[13.5px] text-white outline-none transition placeholder:text-slate-500 focus:border-brand-gold/50" />
                </div>
                <button type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-6 py-3.5 text-[14px] font-bold uppercase tracking-wide text-white shadow-lg shadow-amber-900/30 transition hover:brightness-110">
                  Send message <ArrowRight size={16} />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}