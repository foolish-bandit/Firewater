// app.jsx — single device, swaps between Dusk (dark) and Sundown (light)

const { useState, useEffect } = React;

function useTweaks() {
  const [t, setT] = useState({ ...window.__fw });
  useEffect(() => {
    const on = (e) => setT({ ...e.detail });
    window.addEventListener('fw-tweak', on);
    return () => window.removeEventListener('fw-tweak', on);
  }, []);
  return t;
}

function useScreen() {
  const [s, setS] = useState(localStorage.getItem('fw_redesign_screen') || 'home');
  useEffect(() => {
    const on = (e) => setS(e.detail);
    window.addEventListener('fw-screen', on);
    return () => window.removeEventListener('fw-screen', on);
  }, []);
  return s;
}

function DirDevice({ dark, children }) {
  return (
    <div style={{
      width: 390, height: 820, borderRadius: 48, overflow: 'hidden',
      position: 'relative',
      background: dark ? '#141210' : '#F2ECDF',
      boxShadow: dark
        ? '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.5)'
        : '0 40px 80px rgba(60,40,20,0.25), 0 0 0 1px rgba(60,40,20,0.15)',
      fontFamily: "'JetBrains Mono', monospace",
      WebkitFontSmoothing: 'antialiased',
      transition: 'background 0.4s ease, box-shadow 0.4s ease',
    }}>
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 34, borderRadius: 24, background: '#000', zIndex: 50,
      }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <IOSStatusBar dark={dark} />
      </div>
      <div style={{ height: '100%', overflow: 'hidden', paddingTop: 60 }}>
        {children}
      </div>
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 130, height: 5, borderRadius: 100, zIndex: 60,
        background: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.25)',
      }} />
    </div>
  );
}

function App() {
  const screen = useScreen();
  const t = useTweaks();
  const isDark = t.mode !== 'light';
  const Set = isDark ? window.DuskScreens : window.SundownScreens;
  const Cmp = Set[screen] || Set.home;
  return (
    <DirDevice dark={isDark}>
      <Cmp tweaks={t} />
    </DirDevice>
  );
}

ReactDOM.createRoot(document.getElementById('device')).render(<App />);
