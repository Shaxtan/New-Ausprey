import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils';
import { PRODUCTS } from './data/products';
import { INDUSTRIES } from './data/industries';
import { COMPANY_LINKS } from './data/company';

/* ─────────────────────────── design tokens ─────────────────────────── */
export const BG     = '#070F1E';
export const PANEL  = '#0B1526';
export const PANEL2 = '#0D1A30';

export const GOLD_GRADIENT =
  'bg-gradient-to-r from-amber-200 via-brand-gold to-amber-500 bg-clip-text text-transparent';

export const KEYFRAMES = `
@keyframes gridMove { from { background-position: 0 0; } to { background-position: 0 44px; } }
@keyframes marquee  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes pulseDot { 0%,100% { opacity: 1; transform: scale(1);} 50% { opacity: .45; transform: scale(1.6);} }
@media (prefers-reduced-motion: reduce) {
  .anim-grid, .anim-marquee, .anim-pulse { animation: none !important; }
}
`;

export const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

/* ─────────────────────────── BRAND LOGO ────────────────────────────── */
export function EyeotyLogo({ size = 24, className = '' }) {
  const h = size * 0.95;
  const textStyle = {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontWeight: 600,
    fontSize: size,
    color: '#F5F7FA',
    letterSpacing: '0.01em',
    lineHeight: 1,
  };
  return (
    <div className={cn('flex items-center select-none', className)}>
      <span style={textStyle}>eye</span>
      <svg width={h * 1.31} height={h} viewBox="0 0 42 32" aria-hidden="true"
        style={{ margin: '0 1px', transform: 'translateY(5%)' }}>
        <circle cx="21" cy="16" r="5.6" fill="#D29A4A" />
        <g stroke="#D29A4A" strokeWidth="3.4" fill="none" strokeLinecap="round">
          <path d="M13.5 7.5 A11.5 11.5 0 0 0 13.5 24.5" />
          <path d="M8.5 3.5 A17.5 17.5 0 0 0 8.5 28.5" />
          <path d="M28.5 7.5 A11.5 11.5 0 0 1 28.5 24.5" />
          <path d="M33.5 3.5 A17.5 17.5 0 0 1 33.5 28.5" />
        </g>
      </svg>
      <span style={textStyle}>ty</span>
    </div>
  );
}

/* ─────────────────────────── NAV MENU DATA ─────────────────────────── */
const NAV_MENU = {
  Products: PRODUCTS.map((p) => ({ icon: p.icon, title: p.navTitle, desc: p.navDesc, to: `/products/${p.slug}` })),
  Industries: INDUSTRIES.map((i) => ({ icon: i.icon, title: i.navTitle, desc: i.navDesc, to: `/industries/${i.slug}` })),
  Company: COMPANY_LINKS,
};

/* ─────────────────────────── MEGA MENU ─────────────────────────────── */
function MegaMenuPanel({ items }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Link key={item.title} to={item.to} className="group flex items-start gap-3.5 rounded-xl p-3.5 transition hover:bg-white/5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(210,154,74,0.12)' }}>
            <item.icon size={17} className="text-brand-gold" />
          </span>
          <span>
            <span className="block text-[13.5px] font-bold text-white transition group-hover:text-brand-gold">{item.title}</span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-slate-400">{item.desc}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ─────────────────────────── NAV ───────────────────────────────────── */
const NAV_ITEMS = ['Products', 'Industries', 'Resources', 'Company'];

export function Nav({ onLogin, onRequestDemo }) {
  const [openMenu, setOpenMenu] = useState(null);
  const closeTimer = useRef(null);

  const openWithDelay = (key) => { clearTimeout(closeTimer.current); setOpenMenu(key); };
  const closeWithDelay = () => { closeTimer.current = setTimeout(() => setOpenMenu(null), 160); };

  // If a page doesn't wire onRequestDemo yet, fall back to onLogin so
  // nothing breaks — every existing usage of <Nav> still works as-is.
  const demoHandler = onRequestDemo ?? onLogin;

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <div className="fixed inset-x-0 top-4 z-50 px-4" onMouseLeave={closeWithDelay}>
      <header
        className="mx-auto flex h-[60px] max-w-[1180px] items-center justify-between rounded-2xl border border-white/10 px-5 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(11,21,38,0.82)' }}
      >
        <Link to="/"><EyeotyLogo size={22} /></Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_ITEMS.map((label) => (
            NAV_MENU[label] ? (
              <div key={label} onMouseEnter={() => openWithDelay(label)}>
                <button
                  className={cn(
                    'flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wide transition',
                    openMenu === label ? 'text-white' : 'text-slate-300 hover:text-white'
                  )}
                >
                  {label}
                  <ChevronDown size={13} className={cn('mt-0.5 transition-transform', openMenu === label && 'rotate-180')} />
                </button>
              </div>
            ) : (
              <button key={label} className="text-[13px] font-semibold uppercase tracking-wide text-slate-300 transition hover:text-white">
                {label}
              </button>
            )
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <button onClick={onLogin} className="rounded-xl bg-white px-4 py-2 text-[13px] font-bold text-slate-900 transition hover:bg-slate-200">
            Log In
          </button>
          <button onClick={demoHandler} className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-4 py-2 text-[13px] font-bold text-white shadow-lg shadow-amber-900/30 transition hover:brightness-110">
            Request a Demo
          </button>
        </div>
      </header>

      <AnimatePresence>
        {openMenu && NAV_MENU[openMenu] && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            onMouseEnter={() => openWithDelay(openMenu)}
            className="mx-auto mt-2 max-w-[1180px] overflow-hidden rounded-2xl border border-white/10 p-5 shadow-2xl backdrop-blur-xl"
            style={{ backgroundColor: 'rgba(11,21,38,0.97)' }}
          >
            <MegaMenuPanel items={NAV_MENU[openMenu]} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── PAGE HERO (subpages) ───────────────────── */
export function PageHero({ eyebrow, title, desc, Icon, onPrimary, primaryLabel = 'Request a Demo' }) {
  return (
    <section className="relative overflow-hidden pt-40 pb-16 text-center">
      <div className="pointer-events-none absolute -top-20 right-[10%] h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute -top-10 left-[8%] h-72 w-72 rounded-full bg-brand-gold/8 blur-[130px]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        {Icon && (
          <motion.div {...fadeUp} className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10" style={{ backgroundColor: PANEL }}>
            <Icon size={28} className="text-brand-gold" />
          </motion.div>
        )}
        <motion.p {...fadeUp} className="text-[12px] font-bold uppercase tracking-[0.28em] text-slate-400">{eyebrow}</motion.p>
        <motion.h1 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} className="mt-5 text-[clamp(2.1rem,4.4vw,3.2rem)] font-black leading-[1.1] tracking-[-0.02em] text-white">
          {title}
        </motion.h1>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} className="mx-auto mt-6 max-w-xl text-[16px] leading-7 text-slate-400">
          {desc}
        </motion.p>
        {onPrimary && (
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.18 }} className="mt-9 flex justify-center">
            <button onClick={onPrimary} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-7 py-3.5 text-[14px] font-bold uppercase tracking-wide text-white shadow-xl shadow-amber-900/30 transition hover:-translate-y-0.5 hover:brightness-110">
              {primaryLabel} <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────── FEATURE GRID ───────────────────────────── */
export function FeatureGrid({ title, subtitle, features }) {
  return (
    <section className="py-20" style={{ backgroundColor: PANEL }}>
      <div className="mx-auto max-w-[1180px] px-6">
        {title && (
          <motion.div {...fadeUp} className="mb-14 text-center">
            <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] font-black tracking-tight text-white">{title}</h2>
            {subtitle && <p className="mx-auto mt-4 max-w-xl text-[15px] text-slate-400">{subtitle}</p>}
          </motion.div>
        )}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="rounded-2xl border border-white/8 p-6" style={{ backgroundColor: PANEL2 }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(210,154,74,0.12)' }}>
                <f.icon size={20} className="text-brand-gold" />
              </div>
              <h3 className="text-[15px] font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── POINTS + IMAGE (industries) ────────────── */
export function PointsWithImage({ label, title, points, img }) {
  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <motion.div {...fadeUp}>
          <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-brand-gold">{label}</p>
          <h2 className="mt-4 text-[clamp(1.6rem,2.8vw,2.2rem)] font-black leading-tight tracking-tight text-white">{title}</h2>
          <div className="mt-8 space-y-6">
            {points.map(([t, d]) => (
              <div key={t} className="flex gap-4 border-b border-white/6 pb-6 last:border-0 last:pb-0">
                <ArrowRight size={17} className="mt-0.5 shrink-0 text-brand-gold" />
                <div>
                  <p className="text-[15px] font-bold text-white">{t}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-slate-400">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="relative overflow-hidden rounded-2xl border border-white/10">
          <img src={img} alt={title} loading="lazy" className="h-[380px] w-full object-cover" style={{ backgroundColor: PANEL2 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070F1E]/70 via-transparent to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────── CTA BANNER ─────────────────────────────── */
export function CtaBanner({
  onLogin,
  onRequestDemo,
  title = 'Ready to take control of your operations?',
  desc = 'Discover how Eyeoty can transform your fleet — in one demo.',
  label = 'Request a Demo',
}) {
  // Same fallback pattern as Nav — pages that haven't wired the demo
  // modal yet keep working exactly as before.
  const handler = onRequestDemo ?? onLogin;

  return (
    <section className="px-6 pb-24">
      <motion.div {...fadeUp} className="relative mx-auto max-w-[1180px] overflow-hidden rounded-3xl border border-brand-gold/20 px-10 py-16 text-center" style={{ backgroundColor: PANEL }}>
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[60%] -translate-x-1/2 rounded-full bg-brand-gold/12 blur-[100px]" />
        <ShieldCheck size={34} className="relative mx-auto mb-5 text-brand-gold" />
        <h3 className="relative text-[clamp(1.7rem,3vw,2.4rem)] font-black tracking-tight text-white">{title}</h3>
        <p className="relative mx-auto mt-3 max-w-md text-[15px] text-slate-400">{desc}</p>
        <button onClick={handler} className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-8 py-4 text-[14px] font-bold uppercase tracking-wide text-white shadow-xl shadow-amber-900/30 transition hover:-translate-y-0.5 hover:brightness-110">
          {label} <ArrowRight size={16} />
        </button>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────── FOOTER ─────────────────────────────────── */
export function Footer() {
  const COLS = [
    { title: 'Products',   links: PRODUCTS.map((p) => ({ label: p.navTitle, to: `/products/${p.slug}` })) },
    { title: 'Industries', links: INDUSTRIES.map((i) => ({ label: i.navTitle, to: `/industries/${i.slug}` })) },
    { title: 'Resources',  links: [{ label: 'Blog', to: '#' }, { label: 'Case Studies', to: '#' }, { label: 'Support', to: '#' }] },
    { title: 'Company',    links: COMPANY_LINKS.map((c) => ({ label: c.title, to: c.to })) },
  ];
  return (
    <footer className="border-t border-white/5 px-6 pb-8 pt-16">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link to="/"><EyeotyLogo size={20} /></Link>
            <p className="mt-4 max-w-[250px] text-[13px] leading-relaxed text-slate-500">
              Eyeoty is the intelligence layer for fleet operations — tracking, IoT sensors, and analytics in one platform.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[12px] font-bold uppercase tracking-wider text-slate-300">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-[13px] text-slate-500 transition hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-[12px] text-slate-600">© 2026 Eyeoty. All rights reserved.</p>
          <div className="flex gap-6">
            <button className="text-[12px] text-slate-600 transition hover:text-white">Privacy Policy</button>
            <button className="text-[12px] text-slate-600 transition hover:text-white">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
}