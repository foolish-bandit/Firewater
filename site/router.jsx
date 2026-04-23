// router.jsx — top-level app with nav + page swap + mode sync

const { useState: useRState, useEffect: useREffect } = React;

function App() {
  const initialMode = (() => {
    try { return window.parent.__fw_mode || 'dark'; } catch(e) { return 'dark'; }
  })();
  const initialPage = (() => {
    try { return window.parent.__fw_page || 'landing'; } catch(e) { return 'landing'; }
  })();

  const [page, setPage] = useRState(initialPage);
  const [mode, setMode] = useRState(initialMode);

  useREffect(() => {
    document.body.classList.toggle('light', mode === 'light');
  }, [mode]);

  // Listen to outer shell messages
  useREffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'fw-set-mode') setMode(e.data.mode);
      if (e.data.type === 'fw-set-page') setPage(e.data.page);
    };
    window.addEventListener('message', handler);
    // Announce ready
    try { window.parent.postMessage({ type: 'fw-ready' }, '*'); } catch(e) {}
    return () => window.removeEventListener('message', handler);
  }, []);

  const nav = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'instant' });
    try { window.parent.postMessage({ type: 'fw-page-changed', page: p }, '*'); } catch(e) {}
  };
  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    try { window.parent.postMessage({ type: 'fw-mode-changed', mode: next }, '*'); } catch(e) {}
  };

  const hideNav = page === 'signin';

  let Page;
  switch (page) {
    case 'landing': Page = Landing; break;
    case 'discover': Page = Discover; break;
    case 'catalog': Page = Catalog; break;
    case 'detail': Page = Detail; break;
    case 'profile': Page = Profile; break;
    case 'shelf': Page = Shelf; break;
    case 'dispatch': Page = Dispatch; break;
    case 'article': Page = Article; break;
    case 'download': Page = Download; break;
    case 'about': Page = About; break;
    case 'signin': Page = SignIn; break;
    default: Page = Landing;
  }

  return (
    <div className="grain">
      {!hideNav && <Nav page={page} onNav={nav} mode={mode} onToggleMode={toggleMode} />}
      <div key={page} className="page-enter">
        <Page onNav={nav} />
      </div>
      {hideNav && (
        <button onClick={toggleMode}
                style={{
                  position: 'fixed', top: 24, right: 24, zIndex: 100,
                  padding: '8px 14px', background: 'transparent',
                  border: '1px solid var(--line-strong)', color: 'var(--ink)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em',
                  textTransform: 'uppercase', cursor: 'pointer',
                }}>
          {mode === 'dark' ? 'Dusk' : 'Sundown'}
        </button>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
