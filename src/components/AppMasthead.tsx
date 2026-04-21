import { useEffect, useState } from 'react';
import { Flourish } from './Flourish';

export function AppMasthead() {
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const check = () => setIsLight(document.documentElement.getAttribute('data-theme') === 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const vol = 'VII';
  const day = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div
      className="mx-5 sm:mx-8 md:mx-10 lg:mx-14 py-2 sm:py-3 md:py-4 px-6 sm:px-8 md:px-10"
      style={{
        borderTop: '1px solid var(--text-primary)',
        borderBottom: isLight ? '2px solid var(--text-primary)' : '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="micro-label">Est. 2024</span>
        <span className="micro-label">Vol. {vol} — {day}.</span>
      </div>
      <div className="text-center pt-1 pb-0.5 md:pt-2 md:pb-1">
        <div
          className="tracking-[0.04em] leading-none text-[2.25rem] sm:text-[3rem] md:text-[4rem] lg:text-[5rem]"
          style={{
            fontFamily: isLight ? 'var(--font-display-light)' : 'var(--font-display)',
            fontWeight: isLight ? 700 : 400,
            fontStyle: isLight ? 'normal' : 'italic',
          }}
        >
          FIRE<span className="text-on-surface-accent">·</span>WATER
        </div>
      </div>
      <div className="hidden md:flex justify-center pt-1 pb-0.5 text-on-surface-muted">
        <Flourish width={180} />
      </div>
    </div>
  );
}
