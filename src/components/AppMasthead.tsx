import { useEffect, useState } from 'react';

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
      className="mx-5 py-2 px-6"
      style={{
        borderTop: '1px solid var(--text-primary)',
        borderBottom: isLight ? '2px solid var(--text-primary)' : '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="micro-label">Est. 2024</span>
        <span className="micro-label">Vol. {vol} — {day}.</span>
      </div>
      <div className="text-center pt-1 pb-0.5">
        <div
          className="tracking-[0.04em] leading-none"
          style={{
            fontFamily: isLight ? 'var(--font-display-light)' : 'var(--font-display)',
            fontWeight: isLight ? 700 : 400,
            fontStyle: isLight ? 'normal' : 'italic',
            fontSize: '2.25rem',
          }}
        >
          FIRE<span className="text-on-surface-accent">·</span>WATER
        </div>
      </div>
    </div>
  );
}
