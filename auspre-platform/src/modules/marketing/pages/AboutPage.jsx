import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Users, Rocket, ShieldCheck } from 'lucide-react';
import { Nav, Footer, PageHero, CtaBanner, BG, PANEL, KEYFRAMES, fadeUp } from '../shared';

const VALUES = [
  { icon: Target,      title: 'Operator-first',          desc: 'We build for the people running fleets, not just the people buying software.' },
  { icon: Rocket,       title: 'Ship fast, ship right',    desc: 'Small, focused releases that solve real problems — not roadmaps for their own sake.' },
  { icon: ShieldCheck,  title: 'Reliability over hype',    desc: 'Uptime and data accuracy come before flashy features.' },
  { icon: Users,        title: 'Built with our customers', desc: 'Every module started as a request from a fleet manager in the field.' },
];

export default function AboutPage() {
  const navigate = useNavigate();
  const openLogin = () => navigate('/login');

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen text-white antialiased">
      <style>{KEYFRAMES}</style>
      <Nav onLogin={openLogin} />
      <PageHero
        eyebrow="About Eyeoty"
        title="Built to give fleets an honest picture of their operation"
        desc="Eyeoty started with a simple frustration: fleet data lived in five different places and none of them talked to each other. We built the platform we wished existed."
      />

      <section className="py-20" style={{ backgroundColor: PANEL }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <motion.div {...fadeUp} className="mb-14 text-center">
            <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] font-black tracking-tight text-white">What we believe</h2>
          </motion.div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-2xl border border-white/8 p-6" style={{ backgroundColor: BG }}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(210,154,74,0.12)' }}>
                  <v.icon size={20} className="text-brand-gold" />
                </div>
                <h3 className="text-[15px] font-bold text-white">{v.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.p {...fadeUp} className="text-[16px] leading-8 text-slate-300">
            Today, Eyeoty helps fleet and logistics teams track vehicles, monitor IoT sensors, and
            run their operations from one platform — built by a small team that spends as much
            time talking to dispatchers and drivers as we do writing code.
          </motion.p>
        </div>
      </section>

      <CtaBanner onLogin={openLogin} title="Want to see how we can help your fleet?" />
      <Footer />
    </div>
  );
}