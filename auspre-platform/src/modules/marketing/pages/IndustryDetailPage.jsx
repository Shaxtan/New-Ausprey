import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { INDUSTRIES } from '../data/industries';
import { Nav, Footer, PageHero, PointsWithImage, CtaBanner, BG, KEYFRAMES } from '../shared';

export default function IndustryDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const openLogin = () => navigate('/login');
  const industry = INDUSTRIES.find((i) => i.slug === slug);

  if (!industry) {
    return (
      <div style={{ backgroundColor: BG }} className="min-h-screen text-white antialiased">
        <style>{KEYFRAMES}</style>
        <Nav onLogin={openLogin} />
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-slate-500">404</p>
          <h1 className="mt-4 text-3xl font-black text-white">Industry not found</h1>
          <Link to="/" className="mt-6 flex items-center gap-2 font-semibold text-brand-gold">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen text-white antialiased">
      <style>{KEYFRAMES}</style>
      <Nav onLogin={openLogin} />
      <PageHero
        eyebrow={industry.label}
        title={industry.heroTitle}
        desc={industry.navDesc}
        Icon={industry.icon}
        onPrimary={openLogin}
      />
      <PointsWithImage label={industry.label} title="Built for how you already operate" points={industry.points} img={industry.img} />
      <CtaBanner onLogin={openLogin} title={`Bring Eyeoty to your ${industry.navTitle} operation`} />
      <Footer />
    </div>
  );
}