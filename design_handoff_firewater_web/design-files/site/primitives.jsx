// primitives.jsx — shared React components across pages

const { useState, useEffect, useRef } = React;

// Section rule — ─── ◆ TITLE ◆ ───
function Rule({ title, align = 'center', trailing }) {
  if (align === 'left') {
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
        <span className="kicker"><span style={{ color: 'var(--accent)' }}>◆</span>&nbsp;&nbsp;{title}</span>
        {trailing && <span className="kicker">{trailing}</span>}
      </div>
    );
  }
  return (
    <div className="rule">
      <span className="line" />
      <span><span className="diamond">◆</span>&nbsp;&nbsp;{title}&nbsp;&nbsp;<span className="diamond">◆</span></span>
      <span className="line" />
    </div>
  );
}

function Flourish({ width = 140, color }) {
  return (
    <svg width={width} height="10" viewBox="0 0 140 10" style={{ display: 'block', color: color || 'var(--accent)' }}>
      <line x1="0" y1="5" x2="58" y2="5" stroke="currentColor" strokeWidth="0.6"/>
      <circle cx="62" cy="5" r="1.2" fill="currentColor" />
      <path d="M68 5 L74 1 L80 5 L74 9 Z" fill="currentColor" />
      <circle cx="78" cy="5" r="1.2" fill="currentColor" />
      <line x1="82" y1="5" x2="140" y2="5" stroke="currentColor" strokeWidth="0.6"/>
    </svg>
  );
}

function Compass({ size = 40, opacity = 0.9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ opacity, color: 'var(--accent)' }}>
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 1" />
      {[0, 90, 180, 270].map(a => (
        <path key={a} d="M16 2 L18 16 L16 30 L14 16 Z" fill="currentColor" transform={`rotate(${a} 16 16)`} />
      ))}
      {[45, 135, 225, 315].map(a => (
        <path key={a} d="M16 6 L17 16 L16 26 L15 16 Z" fill="currentColor" opacity="0.35" transform={`rotate(${a} 16 16)`} />
      ))}
    </svg>
  );
}

// Bottle placeholder — stylized silhouette with label
function Bottle({ h = 360, name = 'WILD STALLION', sub = 'Straight Bourbon', year = '2018' }) {
  const w = Math.round(h * 0.38);
  return (
    <div className="ph-bottle" style={{ width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 120 320" width={w * 0.9} height={h * 0.94}>
        <defs>
          <linearGradient id="gl" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2A211A" stopOpacity="0.9"/>
            <stop offset="0.5" stopColor="#1a1512" stopOpacity="0.95"/>
            <stop offset="1" stopColor="#1f1915" stopOpacity="0.9"/>
          </linearGradient>
        </defs>
        {/* Bottle silhouette */}
        <path d="M 48 10 L 72 10 L 72 58 Q 72 64 76 70 L 90 92 Q 98 102 98 118 L 98 300 Q 98 312 86 312 L 34 312 Q 22 312 22 300 L 22 118 Q 22 102 30 92 L 44 70 Q 48 64 48 58 Z"
              fill="url(#gl)" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5"/>
        {/* Cap */}
        <rect x="46" y="4" width="28" height="14" fill="#0a0806" />
        {/* Label */}
        <rect x="28" y="150" width="64" height="110" fill="#E8DFC9" stroke="#2a1f16" strokeWidth="0.8"/>
        <rect x="32" y="154" width="56" height="102" fill="none" stroke="#2a1f16" strokeWidth="0.4"/>
        <text x="60" y="178" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontSize="9" fill="#2a1f16" letterSpacing="0.5">{name.split(' ')[0]}</text>
        <text x="60" y="192" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontSize="9" fontStyle="italic" fill="#B24A2C">{name.split(' ')[1] || ''}</text>
        <line x1="40" y1="200" x2="80" y2="200" stroke="#2a1f16" strokeWidth="0.4"/>
        <text x="60" y="215" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="5" fill="#2a1f16" letterSpacing="1">{sub.toUpperCase()}</text>
        <text x="60" y="244" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="14" fill="#2a1f16">est. {year}</text>
      </svg>
    </div>
  );
}

// Rating — 5 diamonds, filled to rating
function Rating({ value = 4.2, size = 10 }) {
  return (
    <span className="mono" style={{ letterSpacing: '0.3em', fontSize: size, color: 'var(--accent)' }}>
      {[0,1,2,3,4].map(i => i < Math.round(value) ? '◆' : '◇').join(' ')}
      &nbsp;&nbsp;<span style={{ color: 'var(--ink-2)' }}>{value.toFixed(1)}</span>
    </span>
  );
}

// Footer — same across pages
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', marginTop: 120, padding: '56px 0 40px', background: 'var(--surf)' }}>
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
        <div>
          <div className="display italic" style={{ fontSize: 40 }}>Fire<span style={{ color: 'var(--accent)' }}>·</span>water</div>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, maxWidth: 340, marginTop: 14 }}>
            A discovery field guide for spirits. Two thousand bottles, honest notes, and the people who pour them.
          </p>
          <div className="kicker" style={{ marginTop: 24 }}>Est. 2024 · Vol. VII</div>
        </div>
        <FooterCol title="Explore" links={['Discover', 'Catalog', 'The Dispatch', 'About']} />
        <FooterCol title="Account" links={['Sign In', 'Sign Up', 'Get the App', 'Contact']} />
        <FooterCol title="Legal" links={['Drink Responsibly', 'Privacy', 'Terms', '21+ Only']} />
      </div>
      <div className="wrap" style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="kicker">© 2026 Firewater Almanac Co.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Instagram', 'TikTok', 'Twitter', 'RSS'].map(s => <span key={s} className="kicker" style={{ cursor: 'pointer' }}>{s}</span>)}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ {title}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(l => <li key={l} style={{ fontFamily: 'var(--font-body)', fontSize: 16 }}>{l}</li>)}
      </ul>
    </div>
  );
}

Object.assign(window, { Rule, Flourish, Compass, Bottle, Rating, Footer, FooterCol });
