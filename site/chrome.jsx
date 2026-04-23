// chrome.jsx — nav + footer shared across all pages

function Nav({ page, onNav }) {
  const mode = document.body.dataset.mode;
  const items = [
    ['discover', 'Discover'],
    ['catalog', 'Catalog'],
    ['dispatch', 'The Dispatch'],
    ['about', 'About'],
  ];
  return (
    <div style={{
      borderBottom: `1px solid var(--line)`,
      background: 'var(--bg)',
      position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'blur(12px)',
    }}>
      {mode === 'light' && (
        <div style={{ borderBottom: '2px solid var(--ink)', borderTop: '1px solid var(--ink)', margin: '0 32px', padding: '8px 0 6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="label">Est. 2024</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div className="display" style={{ fontSize: 32, letterSpacing: '0.04em', lineHeight: 1 }}>
                FIRE<span style={{ color: 'var(--accent)' }}>·</span>WATER
              </div>
            </div>
            <div className="label">Vol. VII — Wed.</div>
          </div>
        </div>
      )}
      <div style={{
        maxWidth: 1440, margin: '0 auto', padding: mode === 'light' ? '14px 48px' : '20px 48px',
        display: 'flex', alignItems: 'center', gap: 36,
      }}>
        {mode === 'dark' && (
          <div onClick={() => onNav('landing')} style={{ cursor: 'pointer' }}>
            <div className="display" style={{ fontSize: 26, letterSpacing: '0.01em' }}>
              fire<span style={{ color: 'var(--accent)' }}>water</span>
            </div>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', gap: 28, justifyContent: mode === 'light' ? 'center' : 'flex-start' }}>
          {items.map(([k, l]) => (
            <div key={k} onClick={() => onNav(k)} style={{
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em',
              textTransform: 'uppercase', fontWeight: 600,
              color: page === k ? 'var(--accent)' : 'var(--ink-2)',
              cursor: 'pointer', padding: '8px 0',
              borderBottom: page === k ? '2px solid var(--accent)' : '2px solid transparent',
              transition: '0.15s all',
            }}>
              {l}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--line)', minWidth: 220 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <span style={{ fontFamily: 'var(--body)', fontStyle: mode === 'dark' ? 'italic' : 'normal', fontSize: 14, color: 'var(--ink-3)' }}>
              Search bottles…
            </span>
          </div>
          <button className="btn btn-outline" onClick={() => onNav('signin')} style={{ padding: '9px 16px', fontSize: 10 }}>
            Sign in
          </button>
          <button className="btn btn-primary" onClick={() => onNav('download')} style={{ padding: '9px 16px', fontSize: 10 }}>
            Get the app
          </button>
        </div>
      </div>
    </div>
  );
}

function Footer({ onNav }) {
  const mode = document.body.dataset.mode;
  return (
    <footer style={{
      borderTop: mode === 'light' ? '2px solid var(--ink)' : '1px solid var(--line)',
      padding: '64px 48px 40px',
      background: 'var(--surf)',
      marginTop: 80,
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}>
          <div>
            <div onClick={() => onNav('landing')} style={{ cursor: 'pointer' }}>
              <div className="display" style={{ fontSize: mode === 'light' ? 36 : 32, letterSpacing: mode === 'light' ? '0.04em' : '0.01em' }}>
                {mode === 'light' ? (
                  <>FIRE<span style={{ color: 'var(--accent)' }}>·</span>WATER</>
                ) : (
                  <>fire<span style={{ color: 'var(--accent)' }}>water</span></>
                )}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--body)', fontSize: 15, color: 'var(--ink-2)', marginTop: 12, maxWidth: 320, lineHeight: 1.5, fontStyle: mode === 'dark' ? 'italic' : 'normal' }}>
              A liquor discovery, logging, and social app for spirit enthusiasts. Est. 2024.
            </div>
            <div style={{ marginTop: 16 }}>
              <Ornament width={160} />
            </div>
          </div>
          {[
            ['Explore', [['Discover', 'discover'], ['Catalog', 'catalog'], ['The Dispatch', 'dispatch'], ['About', 'about']]],
            ['Account', [['Sign in', 'signin'], ['Get the app', 'download'], ['Your profile', 'profile'], ['Your lists', null]]],
            ['Colophon', [['Made in Kentucky', null], ['On Twitter', null], ['On Instagram', null], ['Press', null]]],
          ].map(([title, links]) => (
            <div key={title}>
              <div className="label label-accent" style={{ marginBottom: 14 }}>◆ {title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map(([l, k]) => (
                  <div key={l} onClick={() => k && onNav(k)} style={{
                    fontFamily: 'var(--body)', fontSize: 16, color: 'var(--ink-2)',
                    cursor: k ? 'pointer' : 'default',
                    fontStyle: mode === 'dark' ? 'italic' : 'normal',
                  }}>{l}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="hairline" style={{ marginBottom: 20 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div className="label">
            © MMXXIV Firewater · Drink responsibly · 21+
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div className="label" style={{ cursor: 'pointer' }}>Privacy</div>
            <div className="label" style={{ cursor: 'pointer' }}>Terms</div>
            <div className="label" style={{ cursor: 'pointer' }}>Cookies</div>
            <div className="label" style={{ cursor: 'pointer' }}>Acceptable Use</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Nav, Footer });
