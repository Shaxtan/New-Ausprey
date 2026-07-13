import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { Nav, Footer, PageHero, FeatureGrid, CtaBanner, BG, KEYFRAMES } from '../shared';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const openLogin = () => navigate('/login');
  const product = PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    return (
      <div style={{ backgroundColor: BG }} className="min-h-screen text-white antialiased">
        <style>{KEYFRAMES}</style>
        <Nav onLogin={openLogin} />
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-slate-500">404</p>
          <h1 className="mt-4 text-3xl font-black text-white">Product not found</h1>
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
        eyebrow={product.heroEyebrow}
        title={product.heroTitle}
        desc={product.heroDesc}
        Icon={product.icon}
        onPrimary={openLogin}
      />
      <FeatureGrid title="Key capabilities" features={product.features} />
      <CtaBanner onLogin={openLogin} title={`See ${product.navTitle} in action`} />
      <Footer />
    </div>
  );
}