import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500">
      <div className="font-display text-[120px] md:text-[180px] leading-none text-on-surface-accent/10 select-none mb-[-2rem]">
        404
      </div>
      <h1 className="font-display text-3xl md:text-4xl text-on-surface mb-3">
        Trail Gone Cold
      </h1>
      <p className="text-on-surface-muted font-serif italic text-lg max-w-md mb-10">
        Looks like this bottle's been moved or never existed. Let's get you back on the trail.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-3 px-6 py-3 bg-on-surface-accent hover:brightness-110 text-on-surface-invert font-sans font-semibold tracking-widest uppercase text-sm transition-all duration-300 gold-glow"
        >
          <Home size={16} />
          Back to Home
        </button>
        <button
          onClick={() => navigate('/catalog')}
          className="flex items-center justify-center gap-3 px-6 py-3 vintage-border hover:border-border-accent-strong text-on-surface-secondary hover:text-on-surface-accent font-sans font-semibold tracking-widest uppercase text-sm transition-all duration-300"
        >
          <Search size={16} />
          Browse Catalog
        </button>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-3 px-6 py-3 vintage-border hover:border-border-accent-strong text-on-surface-secondary hover:text-on-surface-accent font-sans font-semibold tracking-widest uppercase text-sm transition-all duration-300"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    </div>
  );
}
