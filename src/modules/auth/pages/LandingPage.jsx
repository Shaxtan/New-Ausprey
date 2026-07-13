import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useInView, animate } from 'framer-motion';
import {
  Navigation, Radio, BarChart3, Truck, Activity, Route,
  ArrowRight, Play, MapPin, Bell, Building2, Snowflake,
  Factory, ShoppingCart, Server, Clock,
} from 'lucide-react';
import { cn } from '@/utils';
import { PATHS } from '@/constants';
import { Nav, Footer, CtaBanner, BG, PANEL, PANEL2, GOLD_GRADIENT, KEYFRAMES, fadeUp } from '@/modules/marketing/shared';
import LoginModal from '../components/LoginModal';

/* ─────────────────────────── data (landing-page-only) ───────────────── */
const CAPABILITIES = [
  { icon: Server,     label: 'Bank-grade encryption' },
  { icon: Server,     label: '99.9% uptime SLA' },
  { icon: Radio,      label: 'Real-time IoT sync' },
  { icon: Navigation, label: 'Live GPS tracking' },
  { icon: BarChart3,  label: 'Enterprise-ready reporting' },
  { icon: Clock,      label: '24/7 platform monitoring' },
];

const STATS = [
  { to: 2600, suffix: '+',  label: 'Vehicles Tracked' },
  { to: 48,   suffix: 'M+', label: 'KMs Tracked Monthly' },
  { to: 360,  suffix: 'M',  label: 'Data Points / Day' },
  { to: 99.9, suffix: '%',  decimals: 1, label: 'Uptime SLA' },
  { static: '24/7',         label: 'Monitoring & Support' },
];

// The five feature-module cards shown on the landing page — distinct from
// the six routable product pages in modules/marketing/data/products.js
const MODULE_CARDS = [
  { icon: Navigation, title: 'Live Tracking',       desc: 'Track every vehicle, every route, in real time.',            glow: 'rgba(59,130,246,0.35)'  },
  { icon: Radio,      title: 'IoT Sensors',          desc: 'Load cells, fuel, temperature and diagnostics from the field.', glow: 'rgba(139,92,246,0.35)' },
  { icon: Activity,   title: 'Load Cell Analytics',  desc: 'Live and historical load graphs for every IMEI.',            glow: 'rgba(16,185,129,0.32)'  },
  { icon: Route,      title: 'Trip Management',      desc: 'Plan, dispatch and monitor trips end to end.',               glow: 'rgba(210,154,74,0.38)'  },
  { icon: BarChart3,  title: 'Reports & Analytics',  desc: 'Distance, working hours, alerts — exported in one click.',   glow: 'rgba(244,63,94,0.30)'   },
];

// The five tabbed "industries we serve" panels on the landing page — distinct
// from the two routable industry pages in modules/marketing/data/industries.js
const INDUSTRY_TABS = [
  {
    id: 'construction', icon: Building2, label: 'Construction',
    title: 'Optimize site logistics and reduce project delays',
    points: [
      ['Multi-Site Material Coordination', 'Auto-route deliveries across sites based on material urgency and readiness.'],
      ['Heavy Equipment Tracking', 'GPS-enabled tracking of mixers, dump trucks, cranes and machinery.'],
      ['Geofenced Site Alerts', 'Instant entry/exit alerts for every vehicle at every site boundary.'],
    ],
    img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'logistics', icon: Truck, label: 'Logistics & Transport',
    title: 'Move freight with total visibility',
    points: [
      ['Live GPS + Route History', 'Every vehicle on one map with full historical track playback.'],
      ['Trip Planning & Live ETA', 'Dispatch, monitor progress and share accurate arrival times.'],
      ['Driver Behaviour Insights', 'Overspeed, idling and stoppage reports per vehicle and driver.'],
    ],
    img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'coldchain', icon: Snowflake, label: 'Cold Chain & Pharma',
    title: 'Protect temperature-sensitive cargo',
    points: [
      ['Continuous Temperature Sensing', 'IoT probes stream cargo temperature to the platform in real time.'],
      ['Breach Alerts in Seconds', 'Threshold violations trigger instant notifications to your team.'],
      ['Compliance-Ready Reports', 'Exportable temperature logs for audits and SLAs.'],
    ],
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'mining', icon: Factory, label: 'Cement & Mining',
    title: 'Track heavy assets in harsh environments',
    points: [
      ['Load Cell Weight Monitoring', 'Live axle-load graphs catch overloading before penalties.'],
      ['Working-Hour Reports', 'Engine-hour and utilisation analytics for every machine.'],
      ['Unreachable Device Alerts', 'Know immediately when a device drops off the network.'],
    ],
    img: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ecommerce', icon: ShoppingCart, label: 'E-Commerce',
    title: 'Deliver faster with fewer failed runs',
    points: [
      ['Last-Mile Tracking', 'Live rider and van positions across every delivery zone.'],
      ['Geofence Notifications', 'Automatic events when vehicles reach hubs and drop points.'],
      ['Distance & Cost Reports', 'Daily distance per vehicle to keep delivery costs in check.'],
    ],
    img: 'https://images.unsplash.com/photo-1553413077-25b4c0670e4d?auto=format&fit=crop&w=900&q=80',
  },
];

/* ─────────────────────────── shared bits ───────────────────────────── */
function CountUp({ to, decimals = 0, suffix = '', prefix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.8, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setVal(v) });
    return () => controls.stop();
  }, [inView, to]);

  const shown = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-IN');
  return <span ref={ref}>{prefix}{shown}{suffix}</span>;
}

/* ─────────────────────────── HERO ──────────────────────────────────── */
function Hero({ onLogin }) {
  return (
    <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden pt-28 text-center">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46vh] overflow-hidden" style={{ perspective: '520px' }}>
        <div
          className="anim-grid absolute left-[-50%] top-0 h-[200%] w-[200%]"
          style={{
            transform: 'rotateX(64deg)', transformOrigin: 'top center',
            backgroundImage: 'linear-gradient(rgba(210,154,74,0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(210,154,74,0.20) 1px, transparent 1px)',
            backgroundSize: '44px 44px', animation: 'gridMove 14s linear infinite',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 88%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 88%)',
          }}
        />
        <div className="absolute left-1/2 top-0 h-44 w-[70%] -translate-x-1/2 rounded-full bg-brand-gold/10 blur-[90px]" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#070F1E] to-transparent" />
      </div>

      <div className="pointer-events-none absolute -top-20 right-[10%] h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-[12px] font-bold uppercase tracking-[0.28em] text-slate-400">
          Track · Monitor · Optimize
        </motion.p>

        <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08 }}
          className="mt-6 text-[clamp(2.6rem,6.2vw,4.6rem)] font-black leading-[1.06] tracking-[-0.02em] text-white">
          The <span className={GOLD_GRADIENT}>Intelligence</span> Layer
          <br />For Your Fleet Operations
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-[16px] leading-7 text-slate-400">
          From vehicles to sensors to reports — Eyeoty helps your operation run
          with greater efficiency, reliability, and control.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button onClick={onLogin} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-7 py-3.5 text-[14px] font-bold uppercase tracking-wide text-white shadow-xl shadow-amber-900/30 transition hover:-translate-y-0.5 hover:brightness-110">
            Request a Demo <ArrowRight size={16} />
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[14px] font-bold uppercase tracking-wide text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-200">
            <Play size={15} className="fill-slate-900" /> Watch Product Demo
          </button>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="relative z-10 mt-20 w-full">
        <p className="mb-5 text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Built for fleet &amp; logistics operations
        </p>
        <div className="relative mx-auto max-w-5xl overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)' }}>
          <div className="anim-marquee flex w-max items-center gap-14 py-2" style={{ animation: 'marquee 26s linear infinite' }}>
            {[...CAPABILITIES, ...CAPABILITIES].map((c, i) => (
              <span key={i} className="flex items-center gap-2.5 whitespace-nowrap text-[14px] font-semibold text-slate-400">
                <c.icon size={15} className="text-brand-gold" /> {c.label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────── STATS ─────────────────────────────────── */
function StatsBand() {
  return (
    <section className="border-y border-white/5 py-16" style={{ backgroundColor: PANEL }}>
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-y-12 px-6 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map((s, i) => (
          <motion.div key={s.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.07 }}
            className={cn('relative text-center', i > 0 && 'lg:border-l lg:border-white/8')}>
            <div className="text-[clamp(2rem,3.4vw,2.9rem)] font-black tracking-tight text-white">
              {s.static ? s.static : <CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} />}
            </div>
            <div className="mt-2 text-[12px] font-bold uppercase tracking-[0.14em] text-slate-500">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── MODULE CARDS ──────────────────────────── */
function ModuleCards({ onLogin }) {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1180px] px-6">
        <motion.div {...fadeUp} className="mb-14 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-slate-500">Intelligence by Eyeoty</p>
          <h2 className="mt-4 text-[clamp(1.9rem,3.6vw,2.8rem)] font-black tracking-tight text-white">
            Five modules. <span className={GOLD_GRADIENT}>One platform.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-slate-400">
            An end-to-end stack for fleet &amp; IoT — built natively for real-time operations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {MODULE_CARDS.map((p, i) => (
            <motion.div key={p.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} whileHover={{ y: -6 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 p-6" style={{ backgroundColor: PANEL }}>
              <div className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[70px] opacity-70 transition-opacity duration-300 group-hover:opacity-100" style={{ backgroundColor: p.glow }} />
              <h3 className="relative text-[17px] font-black leading-snug text-white">{p.title}</h3>
              <p className="relative mt-2.5 text-[13px] leading-relaxed text-slate-400">{p.desc}</p>
              <div className="relative my-8 flex flex-1 items-center justify-center">
                <p.icon size={52} strokeWidth={1.3} className="text-white/85" />
              </div>
              <button onClick={onLogin} className="relative flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/12 py-2.5 text-[13px] font-bold text-white transition hover:border-white/30 hover:bg-white/5">
                Explore <ArrowRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── INDUSTRY TABS ─────────────────────────── */
function IndustryTabs() {
  const [active, setActive] = useState(INDUSTRY_TABS[0].id);
  const current = INDUSTRY_TABS.find((i) => i.id === active);

  return (
    <section className="border-y border-white/5 py-24" style={{ backgroundColor: '#060C18' }}>
      <div className="mx-auto max-w-[1180px] px-6">
        <motion.div {...fadeUp} className="mb-12 text-center">
          <h2 className="text-[clamp(1.9rem,3.6vw,2.8rem)] font-black tracking-tight text-white">
            Trusted Across <span className={GOLD_GRADIENT}>Industries</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-slate-400">
            To increase efficiency, productivity and safety across fleet &amp; transport operations.
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="mb-12 flex justify-center">
          <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-white/8 p-1.5" style={{ backgroundColor: PANEL }}>
            {INDUSTRY_TABS.map((ind) => (
              <button key={ind.id} onClick={() => setActive(ind.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all',
                  active === ind.id ? 'bg-gradient-to-r from-brand-gold/25 to-amber-500/15 text-white ring-1 ring-brand-gold/40' : 'text-slate-400 hover:text-white'
                )}>
                <ind.icon size={15} /> {ind.label}
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={current.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }} className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-brand-gold">{current.label}</p>
              <h3 className="mt-4 text-[clamp(1.6rem,2.8vw,2.2rem)] font-black leading-tight tracking-tight text-white">{current.title}</h3>
              <div className="mt-8 space-y-6">
                {current.points.map(([t, d]) => (
                  <div key={t} className="flex gap-4 border-b border-white/6 pb-6 last:border-0 last:pb-0">
                    <ArrowRight size={17} className="mt-0.5 shrink-0 text-brand-gold" />
                    <div>
                      <p className="text-[15px] font-bold text-white">{t}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-slate-400">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <img src={current.img} alt={current.label} loading="lazy" className="h-[380px] w-full object-cover" style={{ backgroundColor: PANEL2 }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070F1E]/70 via-transparent to-transparent" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─────────────────────── PLATFORM PREVIEW ──────────────────────────── */
const PREVIEW_TABS = ['Dashboard', 'Live Tracking', 'Load Cell Report'];

function PlatformPreview() {
  const [tab, setTab] = useState(PREVIEW_TABS[0]);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1180px] px-6">
        <motion.div {...fadeUp} className="mb-10 text-center">
          <h2 className="text-[clamp(1.9rem,3.6vw,2.8rem)] font-black tracking-tight text-white">
            The Platform Powering Your <span className={GOLD_GRADIENT}>Entire Fleet Operation</span>
          </h2>
        </motion.div>

        <motion.div {...fadeUp} className="mb-8 flex flex-wrap justify-center gap-2">
          {PREVIEW_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                'rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all',
                tab === t ? 'bg-gradient-to-r from-brand-gold/25 to-amber-500/15 text-white ring-1 ring-brand-gold/40' : 'border border-white/10 text-slate-400 hover:text-white'
              )}>
              {t}
            </button>
          ))}
        </motion.div>

        <motion.div {...fadeUp} className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl" style={{ backgroundColor: PANEL }}>
          <div className="flex items-center gap-2 border-b border-white/6 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-4 rounded-md bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-400">
              app.eyeoty.com/{tab.toLowerCase().replace(/ /g, '-')}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="p-6">
              {tab === 'Dashboard'        && <MockDashboard />}
              {tab === 'Live Tracking'    && <MockTracking />}
              {tab === 'Load Cell Report' && <MockLoadCell />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function MockDashboard() {
  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'Total Devices', v: '2,635', c: 'text-white' },
          { l: 'Moving',        v: '1,983', c: 'text-emerald-400' },
          { l: 'Stopped',       v: '312',   c: 'text-amber-400' },
          { l: 'Alerts',        v: '23',    c: 'text-red-400' },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-white/6 p-4" style={{ backgroundColor: PANEL2 }}>
            <p className="text-[11px] font-semibold text-slate-500">{k.l}</p>
            <p className={cn('mt-1.5 text-2xl font-black', k.c)}>{k.v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/6 p-4" style={{ backgroundColor: PANEL2 }}>
          <p className="mb-3 text-[12px] font-bold text-slate-300">Fleet Utilisation</p>
          {[['VTS Devices', 88, 'bg-blue-500'], ['ELK Devices', 74, 'bg-violet-500'], ['Sensors Online', 96, 'bg-emerald-400']].map(([l, p, c]) => (
            <div key={l} className="mb-3 last:mb-0">
              <div className="mb-1.5 flex justify-between text-[11px] text-slate-400"><span>{l}</span><span className="font-bold text-white">{p}%</span></div>
              <div className="h-1.5 rounded-full bg-white/8"><div className={cn('h-1.5 rounded-full', c)} style={{ width: `${p}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/6 p-4" style={{ backgroundColor: PANEL2 }}>
          <p className="mb-3 text-[12px] font-bold text-slate-300">Live Vehicles</p>
          {[['KA01AB1234', 'Running', '62 km/h', 'text-emerald-400'], ['KA05CD5678', 'Idle', '0 km/h', 'text-amber-400'], ['HR265890', 'Stopped', '0 km/h', 'text-slate-400']].map(([v, s, sp, c]) => (
            <div key={v} className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-0">
              <span className="text-[12px] font-bold text-white">{v}</span>
              <span className={cn('text-[11px] font-bold', c)}>{s}</span>
              <span className="text-[11px] text-slate-500">{sp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockTracking() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_1fr]">
      <div className="rounded-xl border border-white/6 p-3" style={{ backgroundColor: PANEL2 }}>
        <p className="mb-2 px-1 text-[12px] font-bold text-slate-300">Devices</p>
        {[['KA01AB1234', 'Running', 'bg-emerald-400'], ['KA05CD5678', 'Idle', 'bg-amber-400'], ['HS001234', 'Stopped', 'bg-slate-500']].map(([v, s, dot], i) => (
          <div key={v} className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2.5', i === 0 && 'bg-brand-gold/10 ring-1 ring-brand-gold/30')}>
            <span className={cn('h-2 w-2 rounded-full', dot)} />
            <div className="flex-1"><p className="text-[12px] font-bold text-white">{v}</p><p className="text-[10px] text-slate-500">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="relative h-[260px] overflow-hidden rounded-xl border border-white/6" style={{ backgroundColor: PANEL2, backgroundImage: 'radial-gradient(rgba(96,165,250,0.25) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 260" fill="none">
          <path d="M60 210 Q180 60 320 150 T560 80" stroke="#D29A4A" strokeWidth="2.5" strokeDasharray="6 6" opacity="0.9" />
          <circle cx="60" cy="210" r="6" fill="#3b82f6" />
          <circle cx="560" cy="80" r="6" fill="#ef4444" />
        </svg>
        <div className="anim-pulse absolute left-[52%] top-[55%] h-4 w-4 rounded-full bg-brand-gold shadow-[0_0_18px_rgba(210,154,74,0.9)]" style={{ animation: 'pulseDot 1.8s ease-in-out infinite' }} />
        <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg border border-white/8 bg-[#0B1526]/90 px-3 py-2 backdrop-blur">
          <MapPin size={13} className="text-brand-gold" />
          <span className="text-[11px] font-bold text-white">KA01AB1234</span>
          <span className="text-[11px] font-bold text-emerald-400">62 km/h</span>
          <Bell size={12} className="text-slate-500" />
        </div>
      </div>
    </div>
  );
}

function MockLoadCell() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {[['Avg Load', '84.2 T', 'text-brand-gold'], ['Load %', '71.4%', 'text-violet-400'], ['Status', 'Moderate', 'text-emerald-400']].map(([l, v, c]) => (
          <div key={l} className="rounded-lg border border-white/8 px-4 py-2" style={{ backgroundColor: PANEL2 }}>
            <span className="mr-2 text-[11px] text-slate-500">{l}</span><span className={cn('text-[13px] font-black', c)}>{v}</span>
          </div>
        ))}
      </div>
      <div className="relative h-[220px] overflow-hidden rounded-xl border border-white/6 p-4" style={{ backgroundColor: PANEL2 }}>
        <svg className="h-full w-full" viewBox="0 0 600 180" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D29A4A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#D29A4A" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[40, 80, 120].map((y) => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.05)" />)}
          <path d="M0 130 C 60 90, 110 140, 170 100 S 290 60, 350 95 S 470 140, 530 90 L 600 110 L 600 180 L 0 180 Z" fill="url(#goldFill)" />
          <path d="M0 130 C 60 90, 110 140, 170 100 S 290 60, 350 95 S 470 140, 530 90 L 600 110" stroke="#D29A4A" strokeWidth="2.5" />
          <path d="M0 150 C 80 120, 140 155, 210 130 S 330 100, 400 125 S 520 150, 600 120" stroke="#8b5cf6" strokeWidth="1.8" opacity="0.8" />
        </svg>
        <div className="absolute right-4 top-4 flex gap-4 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-slate-300"><span className="h-2 w-2 rounded-full bg-brand-gold" /> Average</span>
          <span className="flex items-center gap-1.5 text-slate-300"><span className="h-2 w-2 rounded-full bg-violet-500" /> Load %</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── PAGE ──────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const showLogin = location.pathname === PATHS.LOGIN;

  const open  = () => navigate(PATHS.LOGIN);
  const close = () => navigate('/', { replace: true });

  return (
    <div className="min-h-screen text-white antialiased" style={{ backgroundColor: BG }}>
      <style>{KEYFRAMES}</style>
      <LoginModal open={showLogin} onClose={close} />
      <Nav            onLogin={open} />
      <Hero           onLogin={open} />
      <StatsBand />
      <ModuleCards    onLogin={open} />
      <IndustryTabs />
      <PlatformPreview />
      <CtaBanner      onLogin={open} />
      <Footer />
    </div>
  );
}