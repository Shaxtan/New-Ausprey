import { ShieldCheck, Navigation, BarChart3, Radio } from 'lucide-react';
import { Logo } from '@/layouts/components/Logo';

const HIGHLIGHTS = [
  { icon: Navigation, title: 'Real-time tracking', text: 'Live positions across your entire fleet.' },
  { icon: Radio, title: 'IoT sensor telemetry', text: 'Fuel, temperature, load and engine health.' },
  { icon: BarChart3, title: 'Operational analytics', text: 'Utilization, distance and performance insights.' },
];

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] relative overflow-hidden bg-sidebar p-10 xl:p-14 flex-col justify-between">
        <div className="absolute inset-0 map-grid opacity-[0.35]" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,99,235,.35), transparent 70%)' }} />
        <div className="relative z-10"><Logo /></div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Fleet intelligence,<br />from edge to dashboard.
          </h2>
          <p className="mt-4 text-sidebar-text leading-relaxed">
            One platform to monitor vehicles, sensors and trips in real time — built for operations teams at scale.
          </p>
          <div className="mt-9 space-y-5">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sidebar-soft border border-sidebar-line flex items-center justify-center shrink-0">
                  <h.icon size={18} className="text-primary" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{h.title}</div>
                  <div className="text-xs text-sidebar-muted mt-0.5">{h.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-sidebar-muted">
          <ShieldCheck size={14} /> SOC 2 compliant · 256-bit encryption
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="rounded-2xl bg-sidebar px-5 py-3"><Logo /></div>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1.5">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;