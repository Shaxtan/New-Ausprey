import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio, BarChart3, Truck, Activity, Bell, Cloud,
  ArrowRight, ChevronDown, Target, TrendingUp,
  MapPin, Menu, TrendingUp as TrendUp,
} from 'lucide-react';
import { cn } from '@/utils';
import { Logo } from '@/layouts/components/Logo';
import LoginModal from '../components/LoginModal';

const NAV_LINKS = [
  { label: 'Solutions',  dropdown: true  },
  { label: 'Products',   dropdown: false },
  { label: 'Technology', dropdown: false },
  { label: 'Industries', dropdown: true  },
  { label: 'Resources',  dropdown: true  },
  { label: 'Company',    dropdown: true  },
];

const HERO_TAGS = [
  { icon: MapPin,     label: 'tracking'  },
  { icon: Radio,      label: 'sensors'   },
  { icon: Truck,      label: 'fleet'     },
  { icon: BarChart3,  label: 'analytics' },
];

const TRUSTED = ['DHL', 'MAERSK', 'CEVA', 'dpd', 'XPO', 'GEODIS'];

const SOLUTIONS = [
  {
    icon: MapPin,
    title: 'Tracking',
    desc: 'Track assets in real-time with accurate location data.',
    img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: Radio,
    title: 'Sensors',
    desc: 'Monitor temperature, humidity, motion and more.',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: Truck,
    title: 'Fleet',
    desc: 'Optimize fleet performance and driver safety.',
    img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Turn data into insights and make smarter decisions.',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
  },
];

const WHY_ITEMS = [
  { icon: Target,     title: 'Real-time Visibility',  desc: "Know where your assets are and what they're doing, anytime, anywhere." },
  { icon: TrendingUp, title: 'Improve Efficiency',    desc: 'Optimize routes, reduce downtime, and lower operational costs.'        },
  { icon: Bell,       title: 'Enhanced Safety',       desc: 'Get instant alerts and reduce risks for your people and assets.'       },
  { icon: Cloud,      title: 'Scalable Platform',     desc: 'Flexible, secure, and built to grow with your business.'               },
  { icon: TrendUp,    title: 'Data-Driven Decisions', desc: 'Leverage powerful analytics to drive performance and growth.'          },
];

/* ══════════════════════════════════ NAV ══════════════════════════════════ */
function Nav({ onLogin }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-sidebar">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-6">
        {/* logo scaled down */}
        <div className="scale-[0.82] origin-left">
          <Logo />
        </div>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <button
              key={l.label}
              className="flex items-center gap-1 text-[13.5px] font-medium text-slate-300 hover:text-white transition"
            >
              {l.label}
              {l.dropdown && <ChevronDown size={13} className="mt-0.5 text-slate-500" />}
            </button>
          ))}
        </nav>

        <button
          onClick={onLogin}
          className="hidden sm:flex items-center gap-2 rounded-lg bg-brand-gold px-5 py-2.5 text-[13.5px] font-bold text-white shadow-md shadow-black/20 transition hover:bg-amber-500"
        >
          Login <ArrowRight size={15} />
        </button>

        <button onClick={onLogin} className="sm:hidden text-white"><Menu size={22} /></button>
      </div>
    </header>
  );
}

/* ═════════════════════════════════ HERO ═════════════════════════════════ */
function Hero({ onLogin }) {
  return (
    <section className="relative overflow-hidden bg-sidebar pt-[68px]">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-3/5 opacity-[0.5]"
        style={{
          backgroundImage: 'radial-gradient(rgba(96,165,250,0.35) 1px, transparent 1.4px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 80% 90% at 75% 40%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 90% at 75% 40%, black 30%, transparent 75%)',
        }}
      />
      <div className="pointer-events-none absolute -top-10 right-24 h-96 w-96 rounded-full bg-blue-500/15 blur-[130px]" />

      <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_1.05fr] lg:py-24">
        {/* ── Left copy ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-brand-gold">
            Track. Monitor. Optimize.
          </p>

          <h1 className="mt-6 font-black tracking-[-0.02em] text-white text-[clamp(2.75rem,5.5vw,4rem)] leading-[1.04]">
            Smarter Tracking<br />Better Decisions
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-7 text-slate-300/90">
            Auspre delivers real-time visibility of your assets, sensors,
            and fleet — so you can improve efficiency, safety, and performance.
          </p>

          <div className="mt-9 flex flex-wrap gap-3.5">
            <button
              onClick={onLogin}
              className="flex items-center gap-2 rounded-lg bg-brand-gold px-6 py-3.5 text-[14.5px] font-bold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-amber-500"
            >
              Request a Demo <ArrowRight size={16} />
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-white/25 px-6 py-3.5 text-[14.5px] font-semibold text-white transition hover:bg-white/5">
              Explore Solutions <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
            {HERO_TAGS.map((t, i) => (
              <div key={t.label} className="flex items-center gap-4">
                {i > 0 && <span className="hidden h-4 w-px bg-white/15 sm:block" />}
                <span className="flex items-center gap-2 text-[13px] font-medium text-brand-gold">
                  <t.icon size={15} /> <span className="text-slate-300">{t.label}</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Right device mockup ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative hidden lg:block h-[420px]"
        >
          <LaptopMock />
          <PhoneMock />
        </motion.div>
      </div>
    </section>
  );
}

function LaptopMock() {
  return (
    <div className="absolute left-0 top-2 w-[80%]">
      <div className="rounded-t-xl border-[6px] border-b-0 border-slate-800 bg-[#0B1526] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-red-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          <span className="ml-3 text-[9px] font-semibold text-slate-400">Dashboard</span>
        </div>
        <div className="flex">
          <div className="hidden sm:flex w-9 flex-col items-center gap-3 border-r border-white/5 py-3">
            {[Truck, MapPin, BarChart3, Bell, Activity].map((I, i) => (
              <I key={i} size={11} className={i === 0 ? 'text-blue-400' : 'text-slate-600'} />
            ))}
          </div>
          <div className="flex-1 p-3">
            <p className="text-[8px] font-semibold text-slate-500 mb-2">Live Overview</p>
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              {[
                { l: 'Assets', v: '2,635', c: 'text-white' },
                { l: 'Active', v: '1,983', c: 'text-emerald-400' },
                { l: 'Alerts', v: '23',    c: 'text-red-400' },
              ].map((k) => (
                <div key={k.l} className="rounded-md bg-white/[0.04] p-2">
                  <p className="text-[6.5px] text-slate-500">{k.l}</p>
                  <p className={cn('text-[13px] font-black leading-none mt-1', k.c)}>{k.v}</p>
                  <div className="mt-1.5 h-3 rounded-sm bg-gradient-to-t from-blue-500/30 to-transparent" />
                </div>
              ))}
            </div>
            <div className="relative h-[92px] rounded-md bg-[#0d1a30] overflow-hidden"
              style={{ backgroundImage: 'radial-gradient(rgba(96,165,250,0.25) 0.8px, transparent 0.8px)', backgroundSize: '10px 10px' }}>
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 92" fill="none">
                <path d="M20 70 Q70 20 110 55 T185 30" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                <circle cx="20" cy="70" r="3" fill="#3b82f6" />
                <circle cx="110" cy="55" r="3" fill="#10b981" />
                <circle cx="185" cy="30" r="3" fill="#ef4444" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="h-2 rounded-b-xl bg-slate-700 shadow-xl" />
      <div className="mx-auto h-1 w-1/4 rounded-b bg-slate-800" />
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="absolute right-0 bottom-0 w-[150px] rounded-[20px] border-4 border-slate-800 bg-[#0B1526] shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-[8px] font-semibold text-slate-300">Asset Details</span>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </div>
      <div className="p-3">
        <p className="text-[11px] font-black text-white">Truck 105</p>
        <span className="text-[7px] font-semibold text-emerald-400">● Moving</span>
        <div className="my-2 h-16 rounded-md bg-[#0d1a30]"
          style={{ backgroundImage: 'radial-gradient(rgba(96,165,250,0.25) 0.8px, transparent 0.8px)', backgroundSize: '9px 9px' }}>
          <svg viewBox="0 0 130 64" className="h-full w-full" fill="none">
            <path d="M15 50 Q45 15 75 40 T120 20" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2.5 2.5" />
          </svg>
        </div>
        {[
          { l: 'Location', v: '7.2 km', c: 'text-slate-300' },
          { l: 'Speed',    v: '68 km/h', c: 'text-blue-400' },
          { l: 'Fuel',     v: '58%',     c: 'text-emerald-400' },
          { l: 'Engine',   v: '1,236 h', c: 'text-amber-400' },
        ].map((r) => (
          <div key={r.l} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
            <span className="text-[7px] text-slate-500">{r.l}</span>
            <span className={cn('text-[8px] font-bold', r.c)}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════ TRUSTED BY ══════════════════════════════ */
function TrustedBy() {
  return (
    <section className="bg-slate-50 py-11">
      <div className="mx-auto max-w-[1180px] px-6">
        <p className="mb-8 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
          Trusted by Businesses Worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
          {TRUSTED.map((n) => (
            <span key={n} className="text-[22px] font-black tracking-tight text-slate-300 grayscale transition hover:text-slate-400">
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════ SOLUTIONS ══════════════════════════════ */
function Solutions() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-14 text-center">
          <h2 className="text-[34px] font-black tracking-tight text-slate-900">
            Powerful Solutions for Every Need
          </h2>
          <p className="mt-3 text-[16px] text-slate-500">
            From asset tracking to advanced analytics, Auspre helps you stay ahead.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SOLUTIONS.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-slate-200/80 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-16px_rgba(15,23,42,0.2)]"
            >
              {/* icon chip */}
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm">
                <s.icon size={19} className="text-brand-gold" />
              </div>
              {/* real image */}
              <div className="relative mb-4 h-40 overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={s.img}
                  alt={s.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 to-transparent" />
              </div>
              <div className="px-2 pb-2">
                <h3 className="text-[16px] font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{s.desc}</p>
                <button className="mt-4 flex items-center gap-1.5 text-[13px] font-bold text-brand-gold transition-all group-hover:gap-2.5">
                  Learn more <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════ WHY ═══════════════════════════════════ */
function WhyAuspre() {
  return (
    <section className="bg-blue-50/40 py-24">
      <div className="mx-auto max-w-[1180px] px-6">
        <h2 className="mb-16 text-center text-[34px] font-black tracking-tight text-slate-900">
          Why Eyeoty?
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-5">
          {WHY_ITEMS.map((item, i) => (
            <div key={item.title} className="relative text-center">
              {i > 0 && <span className="absolute -left-3 top-2 hidden h-24 w-px bg-slate-200 lg:block" />}
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-slate-700">
                <item.icon size={26} strokeWidth={1.6} />
              </div>
              <h3 className="mb-2 text-[14.5px] font-bold text-slate-900">{item.title}</h3>
              <p className="text-[12.5px] leading-relaxed text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════ CTA ═══════════════════════════════════ */
function CtaBanner({ onLogin }) {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col items-center justify-between gap-8 rounded-2xl bg-sidebar px-10 py-12 md:flex-row">
          <div className="flex items-center gap-6 text-center md:text-left">
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-gold/15 sm:flex">
              <Radio size={30} className="text-brand-gold" />
            </div>
            <div>
              <h3 className="text-[26px] font-black leading-tight text-white">
                Ready to take control<br className="hidden sm:block" /> of your operations?
              </h3>
              <p className="mt-2 text-[15px] text-slate-400">
                Discover how Auspre can transform your business.
              </p>
            </div>
          </div>
          <button
            onClick={onLogin}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-gold px-7 py-3.5 text-[14.5px] font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-500"
          >
            Request a Demo <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════ FOOTER ═════════════════════════════════ */
function Footer() {
  const COLS = [
    { title: 'Solutions',  links: ['Tracking', 'Sensors', 'Fleet', 'Analytics'] },
    { title: 'Industries', links: ['Logistics', 'Transportation', 'Healthcare', 'Construction', 'Retail'] },
    { title: 'Resources',  links: ['Blog', 'Case Studies', 'Whitepapers', 'Support'] },
    { title: 'Company',    links: ['About Us', 'Careers', 'Partners', 'Contact Us'] },
  ];
  return (
    <footer className="bg-sidebar px-6 pt-16 pb-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <div className="scale-[0.2] origin-left">
              <Logo />
            </div>
            <p className="mt-4 max-w-[240px] text-[13px] leading-relaxed text-slate-400">
              Auspre is an IoT platform providing tracking, sensor monitoring, fleet
              management and analytics solutions to businesses worldwide.
            </p>
            <div className="mt-5 flex gap-2.5">
              {['in', 'f', 'yt'].map((s) => (
                <button key={s} className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-[11px] font-bold text-slate-400 transition hover:bg-white/5 hover:text-white">
                  {s}
                </button>
              ))}
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[13px] font-bold text-white">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <button className="text-[13px] text-slate-400 transition hover:text-white">{l}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-[12.5px] text-slate-500">© 2024 Auspre. All rights reserved.</p>
          <div className="flex gap-6">
            <button className="text-[12.5px] text-slate-500 transition hover:text-white">Privacy Policy</button>
            <button className="text-[12.5px] text-slate-500 transition hover:text-white">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════ MAIN ══════════════════════════════════ */
export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const open  = () => setShowLogin(true);
  const close = () => setShowLogin(false);

  return (
    <div className="min-h-screen bg-white">
      <LoginModal open={showLogin} onClose={close} />
      <Nav       onLogin={open} />
      <Hero      onLogin={open} />
      <TrustedBy />
      <Solutions />
      <WhyAuspre />
      <CtaBanner onLogin={open} />
      <Footer />
    </div>
  );
}