import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Zap, GraduationCap, Globe, ArrowRight } from 'lucide-react';
import { Nav, Footer, PageHero, BG, PANEL, PANEL2, KEYFRAMES, fadeUp } from '../shared';

const PERKS = [
  { icon: Heart,          title: 'Health coverage', desc: 'Comprehensive health insurance for you and your family.' },
  { icon: Zap,            title: 'Move fast',        desc: 'Small team, real ownership — your work ships in days, not quarters.' },
  { icon: GraduationCap,  title: 'Learning budget',  desc: 'Support for courses, books, and conferences that help you grow.' },
  { icon: Globe,          title: 'Flexible work',    desc: 'Hybrid setup built around getting things done, not seat time.' },
];

// Sample openings — replace with your live roles.
const OPENINGS = [
  { title: 'Frontend Engineer (React)',    dept: 'Engineering',      location: 'Pune / Remote' },
  { title: 'Backend Engineer (Node.js)',   dept: 'Engineering',      location: 'Pune / Remote' },
  { title: 'Fleet Operations Analyst',     dept: 'Customer Success', location: 'Pune' },
  { title: 'Sales Executive — Enterprise', dept: 'Sales',            location: 'Pune / Remote' },
];

export default function CareersPage() {
  const navigate = useNavigate();
  const openLogin = () => navigate('/login');

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen text-white antialiased">
      <style>{KEYFRAMES}</style>
      <Nav onLogin={openLogin} />
      <PageHero
        eyebrow="Careers at Eyeoty"
        title="Help fleets run on better information"
        desc="We're a small team solving real operational problems for fleet and logistics teams. If that sounds interesting, we'd like to hear from you."
      />

      <section className="py-20" style={{ backgroundColor: PANEL }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <motion.div {...fadeUp} className="mb-14 text-center">
            <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] font-black tracking-tight text-white">Why join us</h2>
          </motion.div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map((p, i) => (
              <motion.div key={p.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-2xl border border-white/8 p-6" style={{ backgroundColor: PANEL2 }}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(210,154,74,0.12)' }}>
                  <p.icon size={20} className="text-brand-gold" />
                </div>
                <h3 className="text-[15px] font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-[900px] px-6">
          <motion.h2 {...fadeUp} className="mb-3 text-center text-[clamp(1.7rem,3vw,2.4rem)] font-black tracking-tight text-white">
            Open positions
          </motion.h2>
          <motion.p {...fadeUp} className="mb-12 text-center text-[14px] text-slate-500">
            Don't see a role that fits? Email us at <span className="text-slate-300">careers@eyeoty.com</span> anyway.
          </motion.p>
          <div className="space-y-3">
            {OPENINGS.map((o, i) => (
              <motion.div key={o.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="flex flex-col gap-3 rounded-2xl border border-white/8 p-5 sm:flex-row sm:items-center sm:justify-between"
                style={{ backgroundColor: PANEL }}>
                <div>
                  <p className="text-[15px] font-bold text-white">{o.title}</p>
                  <p className="mt-1 text-[12.5px] text-slate-400">{o.dept} · {o.location}</p>
                </div>
                <Link to="/company/contact-us"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 px-5 py-2.5 text-[13px] font-bold text-white transition hover:border-brand-gold/50 hover:bg-white/5">
                  Apply <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}