// nav.jsx — top navigation + masthead

const { useState: useNavState } = React;

function Nav({ page, onNav, mode, onToggleMode }) {
  const links = [
    ['discover', 'Discover'],
    ['catalog', 'Catalog'],
    ['dispatch', 'The Dispatch'],
    ['about', 'About'],
  ];
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
      backdropFilter: 'blur(14px) saturate(1.1)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', gap: 32, height: 72 }}>
        <div onClick={() => onNav('landing')} style={{ cursor: 'pointer' }}>
          <span className="display italic" style={{ fontSize: 26 }}>
            Fire<span style={{ color: 'var(--accent)' }}>·</span>water
          </span>
        </div>
        <nav style={{ display: 'flex', gap: 28, marginLeft: 24 }}>
          {links.map(([id, label]) => (
            <a key={id}
               onClick={() => onNav(id)}
               style={{
                 cursor: 'pointer',
                 fontFamily: 'var(--font-mono)', fontSize: 11,
                 letterSpacing: '0.22em', textTransform: 'uppercase',
                 color: page === id ? 'var(--accent)' : 'var(--ink-2)',
                 paddingBottom: 4,
                 borderBottom: page === id ? '1px solid var(--accent)' : '1px solid transparent',
               }}>
              {label}
            </a>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <button className="chip" onClick={onToggleMode} title="Toggle theme">
          <span style={{ width: 8, height: 8, borderRadius: 8, background: 'var(--accent)' }} />
          {mode === 'dark' ? 'Dusk' : 'Sundown'}
        </button>
        <a onClick={() => onNav('shelf')} className="kicker" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: page === 'shelf' ? 'var(--accent)' : undefined }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--accent)', background: 'var(--surf-alt)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12 }}>JC</span>
          My Shelf
        </a>
        <a onClick={() => onNav('signin')} className="kicker" style={{ cursor: 'pointer' }}>Sign In</a>
        <button className="btn btn-primary" onClick={() => onNav('download')}>Get the App</button>
      </div>
    </header>
  );
}

function Masthead() {
  const vol = 'VII';
  const day = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  return (
    <div className="wrap" style={{ padding: '18px 48px' }}>
      <div style={{
        borderTop: '1px solid var(--ink)',
        borderBottom: '2px solid var(--ink)',
        padding: '10px 0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kicker">Est. MMXXIV</span>
          <span className="kicker">Vol. {vol} · {day}.</span>
        </div>
        <div style={{ textAlign: 'center', padding: '6px 0 2px' }}>
          <span className="display" style={{ fontSize: 72, letterSpacing: '0.04em' }}>
            FIRE<span style={{ color: 'var(--accent)' }}>·</span>WATER
          </span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span className="kicker" style={{ fontSize: 10 }}>
            A Field Guide to American Spirits &nbsp;·&nbsp; Curated · Reviewed · Logged
          </span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Nav, Masthead });
