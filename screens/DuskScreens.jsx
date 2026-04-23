// DuskScreens.jsx — Direction A: refined dark + brass, subtle western
// Fonts: DM Serif Display (headlines), Cormorant (body), JetBrains Mono (labels)

const DUSK = {
  bg: '#141210',
  surf: '#1C1815',
  surfAlt: '#231E19',
  ink: '#EAE4D9',
  ink2: 'rgba(234,228,217,0.68)',
  ink3: 'rgba(234,228,217,0.42)',
  line: 'rgba(234,228,217,0.12)',
  lineStrong: 'rgba(234,228,217,0.22)',
};

const dFont = {
  display: "'DM Serif Display', serif",
  body: "'Cormorant', 'Cormorant Garamond', Georgia, serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

const Label = ({ children, style, accent }) => (
  <div style={{
    fontFamily: dFont.mono, fontSize: 9.5, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: accent || DUSK.ink3, ...style,
  }}>{children}</div>
);

const Hairline = ({ color = DUSK.line, style = {} }) => (
  <div style={{ height: 1, background: color, ...style }} />
);

const Compass = ({ size = 22, color = 'currentColor', op = 0.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity: op }}>
    <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="0.5" />
    <path d="M12 2 L14 12 L12 22 L10 12 Z" fill={color} />
    <path d="M2 12 L12 10 L22 12 L12 14 Z" fill={color} opacity="0.5" />
    <circle cx="12" cy="12" r="1" fill={color} />
  </svg>
);

const Star = ({ filled = true, size = 11, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 10 10">
    <path d="M5 0.5 L6.2 3.7 L9.5 3.9 L6.9 6 L7.8 9.2 L5 7.4 L2.2 9.2 L3.1 6 L0.5 3.9 L3.8 3.7 Z"
      fill={filled ? color : 'none'} stroke={color} strokeWidth="0.5"/>
  </svg>
);

const Bottle = ({ h = 140, accent = '#C89B3C', shade = 'amber' }) => {
  const fills = {
    amber: 'linear-gradient(180deg, #3a2815 0%, #6b3d14 55%, #b07a2b 100%)',
    dark:  'linear-gradient(180deg, #1a1008 0%, #3d1f0a 55%, #6b3a12 100%)',
    clear: 'linear-gradient(180deg, #2a2420 0%, #4a3e34 55%, #8a7760 100%)',
    light: 'linear-gradient(180deg, #4a3820 0%, #8a6a35 55%, #d4a85a 100%)',
  };
  const w = h * 0.34;
  return (
    <div style={{ width: w, height: h, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: w*0.24, height: h*0.22, background: fills[shade], borderRadius: '2px 2px 0 0' }} />
      <div style={{ width: w*0.9, height: h*0.1, background: fills[shade], clipPath: 'polygon(0 100%, 15% 0, 85% 0, 100% 100%)' }} />
      <div style={{
        width: w, height: h*0.68, background: fills[shade],
        borderRadius: '2px 2px 4px 4px', position: 'relative',
        boxShadow: 'inset 2px 0 6px rgba(255,255,255,0.05), inset -2px 0 8px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          position: 'absolute', top: '28%', left: '10%', right: '10%', bottom: '18%',
          background: '#EAE4D9', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 3, padding: 4,
        }}>
          <div style={{ width: '80%', height: 1, background: accent }} />
          <div style={{ fontFamily: dFont.display, fontSize: 9, color: '#231D16', letterSpacing: '0.04em' }}>—</div>
          <div style={{ width: '60%', height: 1, background: '#231D16' }} />
        </div>
      </div>
    </div>
  );
};

// Hexagonal radar chart for Flavor DNA
const FlavorRadar = ({ data, accent, ink3, line }) => {
  const cx = 100, cy = 100, R = 78;
  const n = data.length;
  const angle = (i) => -Math.PI/2 + (i * 2 * Math.PI / n);
  const point = (i, v) => {
    const r = (v/10) * R;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };
  const polyPts = data.map((d, i) => point(i, d.v).join(',')).join(' ');
  const rings = [2,4,6,8,10];
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      {rings.map(r => (
        <polygon key={r} points={data.map((_, i) => {
          const rad = (r/10) * R;
          return `${cx + rad * Math.cos(angle(i))},${cy + rad * Math.sin(angle(i))}`;
        }).join(' ')} fill="none" stroke={line} strokeWidth="0.4" />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={line} strokeWidth="0.4" />;
      })}
      <polygon points={polyPts} fill={accent} fillOpacity="0.22" stroke={accent} strokeWidth="1" />
      {data.map((d, i) => {
        const [x, y] = point(i, d.v);
        return <circle key={i} cx={x} cy={y} r="1.6" fill={accent} />;
      })}
      {data.map((d, i) => {
        const [x, y] = point(i, 11.8);
        return (
          <text key={i} x={x} y={y} fill={ink3} fontSize="7.5" fontFamily="JetBrains Mono" textAnchor="middle" dominantBaseline="middle" style={{ letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {d.k}
          </text>
        );
      })}
    </svg>
  );
};

const TabBar = ({ active = 'discover' }) => {
  const items = [
    ['discover', 'Discover', <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 3 L14 12 L12 21 L10 12 Z" fill="currentColor"/></svg>],
    ['catalog', 'Catalog', <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 5h16M4 12h16M4 19h16"/></svg>],
    ['lists', 'Lists', <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 4h9l4 4v12H6z"/><path d="M15 4v4h4"/></svg>],
    ['profile', 'Profile', <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="9" r="3.5"/><path d="M5 20c1-4 5-6 7-6s6 2 7 6"/></svg>],
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
      background: 'rgba(20,18,16,0.92)', backdropFilter: 'blur(16px)',
      borderTop: `1px solid ${DUSK.line}`, paddingBottom: 22, paddingTop: 10,
      display: 'flex', justifyContent: 'space-around',
    }}>
      {items.map(([k, l, icon]) => (
        <div key={k} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: active === k ? 'var(--accentA)' : DUSK.ink3,
        }}>
          {icon}
          <div style={{ fontFamily: dFont.mono, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{l}</div>
        </div>
      ))}
    </div>
  );
};

// ONBOARDING
function Onboarding({ tweaks }) {
  const accent = tweaks.accentA;
  return (
    <div style={{ height: '100%', background: DUSK.bg, color: DUSK.ink, padding: '24px 28px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 820" preserveAspectRatio="none">
          {[...Array(10)].map((_, i) => (
            <path key={i} d={`M0,${100 + i*70} Q100,${80 + i*70} 200,${110 + i*70} T400,${90 + i*70}`} stroke={accent} strokeWidth="0.5" fill="none" />
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
        <Label>Step 02 / 04</Label>
        <Label style={{ color: DUSK.ink2 }}>Skip</Label>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
        {[1,0,0,0].map((on,i) => (
          <div key={i} style={{ flex: 1, height: 2, background: i < 2 ? accent : DUSK.lineStrong }} />
        ))}
      </div>
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Compass size={34} color={accent} op={0.85} />
        <div style={{ fontFamily: dFont.display, fontSize: 42, lineHeight: 1.08, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
          What fire<br/>are you chasing?
        </div>
        <div style={{ fontFamily: dFont.body, fontSize: 17, lineHeight: 1.5, color: DUSK.ink2, fontStyle: 'italic', maxWidth: 300 }}>
          Pick the spirits you reach for. We'll tune your catalog, recommendations, and tasting notes accordingly.
        </div>
      </div>
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[['Bourbon', true], ['Rye', true], ['Scotch', false], ['Japanese', true], ['Tequila', false], ['Mezcal', false], ['Gin', false], ['Rum', false]].map(([n, on]) => (
          <div key={n} style={{
            padding: '14px 14px',
            border: `1px solid ${on ? accent : DUSK.line}`,
            background: on ? `color-mix(in srgb, ${accent} 14%, transparent)` : 'transparent',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontFamily: dFont.display, fontSize: 20, color: on ? accent : DUSK.ink }}>{n}</span>
            {on && <div style={{ width: 8, height: 8, borderRadius: 999, background: accent }} />}
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button style={{
        background: accent, color: DUSK.bg, border: 'none',
        padding: '18px 20px', fontFamily: dFont.mono, fontSize: 11,
        letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
      }}>
        Continue →
      </button>
      <div style={{ height: 28 }} />
    </div>
  );
}

// HOME (unchanged)
function Home({ tweaks }) {
  const accent = tweaks.accentA;
  return (
    <div style={{ height: '100%', background: DUSK.bg, color: DUSK.ink, overflow: 'hidden', position: 'relative' }}>
      <div style={{ overflow: 'auto', height: '100%', paddingBottom: 100 }}>
        <div style={{ padding: '8px 24px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: dFont.display, fontSize: 26, letterSpacing: '0.01em' }}>
            Fire<span style={{ color: accent, fontStyle: 'italic' }}>water</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 30, height: 30, border: `1px solid ${DUSK.line}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DUSK.ink2} strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4V2M16 4V2M3 10h18"/></svg>
            </div>
            <div style={{ width: 30, height: 30, border: `1px solid ${DUSK.line}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DUSK.ink2} strokeWidth="1.5"><path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"/></svg>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 24px', marginBottom: 18 }}>
          <div style={{ border: `1px solid ${DUSK.line}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, background: DUSK.surf }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DUSK.ink3} strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <span style={{ fontFamily: dFont.body, fontStyle: 'italic', fontSize: 15, color: DUSK.ink3 }}>
              "smoky bourbon under $50"
            </span>
          </div>
        </div>
        <div style={{ padding: '0 24px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Label accent={accent}>◆ Tonight's Pour</Label>
          <Label>View all →</Label>
        </div>
        <div style={{ padding: '0 24px', marginBottom: 28 }}>
          <div style={{ background: DUSK.surf, border: `1px solid ${DUSK.line}`, padding: '22px 22px 20px', display: 'grid', gridTemplateColumns: '110px 1fr', gap: 18, alignItems: 'end', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent} 30%, ${accent} 70%, transparent)`, opacity: 0.6 }} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Bottle h={150} accent={accent} shade="amber" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label accent={accent}>Bourbon · Kentucky</Label>
              <div style={{ fontFamily: dFont.display, fontSize: 24, lineHeight: 1.1, fontStyle: 'italic' }}>
                Elkhorn Creek Single Barrel
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: accent }}>
                {[1,1,1,1,0].map((f,i) => <Star key={i} filled={!!f} size={11} />)}
                <span style={{ fontFamily: dFont.mono, fontSize: 10, color: DUSK.ink2 }}>4.3 · 218</span>
              </div>
              <div style={{ fontFamily: dFont.body, fontStyle: 'italic', fontSize: 14, color: DUSK.ink2, lineHeight: 1.4, marginTop: 2 }}>
                Honeyed oak, orchard fruit, long quiet finish.
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 24px', marginBottom: 12 }}>
          <Label accent={accent}>◆ Veins of Spirit</Label>
        </div>
        <div style={{ padding: '0 24px', marginBottom: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['Bourbon', '482'], ['Scotch', '394'], ['Rye', '201'], ['Tequila', '316']].map(([n, count]) => (
            <div key={n} style={{ border: `1px solid ${DUSK.line}`, padding: '16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: DUSK.surf }}>
              <div style={{ fontFamily: dFont.display, fontSize: 20 }}>{n}</div>
              <div style={{ fontFamily: dFont.mono, fontSize: 10, color: DUSK.ink3 }}>{count}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 24px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Label accent={accent}>◆ The Dispatch</Label>
          <Label>Vol. VII</Label>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['A quiet case for wheated mash', 'Essay · 4 min'], ['Six ryes under fifty', 'Field guide'], ['How finish wood rewrites palate', 'Primer · 6 min']].map(([title, tag], i) => (
            <div key={i}>
              <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10, alignItems: 'baseline' }}>
                <div style={{ fontFamily: dFont.mono, fontSize: 10, color: DUSK.ink3 }}>{String(i+1).padStart(2,'0')}</div>
                <div style={{ fontFamily: dFont.display, fontSize: 18, lineHeight: 1.2, fontStyle: 'italic' }}>{title}</div>
                <div style={{ fontFamily: dFont.mono, fontSize: 9, color: DUSK.ink3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{tag}</div>
              </div>
              {i < 2 && <div style={{ height: 1, background: DUSK.line, marginTop: 14 }} />}
            </div>
          ))}
        </div>
      </div>
      <TabBar active="discover" />
    </div>
  );
}

// ────────────────────────────────────────────────
// CATALOG — refreshed to match production patterns
// multi-select categories, region chips, price presets, sort, pagination, active-view strip
// ────────────────────────────────────────────────
function Catalog({ tweaks }) {
  const accent = tweaks.accentA;
  const [activeCats, setActiveCats] = React.useState(new Set(['Bourbon', 'High Proof']));
  const [price, setPrice] = React.useState('under-100');
  const [regions, setRegions] = React.useState(new Set(['Kentucky']));
  const [sort, setSort] = React.useState('Rating ↓');
  const [sortOpen, setSortOpen] = React.useState(false);

  const CATS = ['All', 'Bourbon', 'Rye', 'Scotch', 'Agave', 'High Proof', 'Single Barrel', 'Wheated'];
  const PRICE = [['Any', 'any'], ['Under $50', 'under-50'], ['Under $100', 'under-100'], ['$100+', 'over-100']];
  const REGIONS = ['Kentucky', 'Tennessee', 'Islay', 'Highland', 'Japan', 'Jalisco'];
  const SORTS = ['Name A–Z', 'Price ↑', 'Price ↓', 'Proof ↑', 'Proof ↓', 'Rating ↓'];

  const toggleCat = (c) => {
    setActiveCats(prev => {
      const next = new Set(prev);
      if (c === 'All') return new Set(['All']);
      next.delete('All');
      if (next.has(c)) next.delete(c); else next.add(c);
      if (next.size === 0) next.add('All');
      return next;
    });
  };
  const toggleRegion = (r) => {
    setRegions(prev => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r); else next.add(r);
      return next;
    });
  };

  const items = [
    ['Blanton Gold', 'Bourbon', '93 PR', '$89', 4.5, 'amber', 'Kentucky'],
    ['Redbreast 12', 'Irish', '80 PR', '$65', 4.4, 'light', 'Cork'],
    ['Lagavulin 16', 'Scotch', '86 PR', '$112', 4.7, 'dark', 'Islay'],
    ['Hibiki Harmony', 'Japanese', '86 PR', '$90', 4.3, 'light', 'Japan'],
    ['Clase Azul Reposado', 'Tequila', '80 PR', '$180', 4.2, 'clear', 'Jalisco'],
    ['Stagg Jr', 'Bourbon', '130 PR', '$98', 4.6, 'amber', 'Kentucky'],
  ];

  const activeCount = (activeCats.has('All') ? 0 : activeCats.size) + (price !== 'any' ? 1 : 0) + regions.size;
  const total = 2184;
  const matching = 342;

  const activeDescriptions = [];
  if (!activeCats.has('All')) activeDescriptions.push(`in ${[...activeCats].join(', ')}`);
  if (regions.size > 0) activeDescriptions.push(`from ${[...regions].join(', ')}`);
  if (price !== 'any') {
    const pLabels = { 'under-50': 'under $50', 'under-100': 'under $100', 'over-100': '$100+' };
    activeDescriptions.push(pLabels[price]);
  }

  return (
    <div style={{ height: '100%', background: DUSK.bg, color: DUSK.ink, position: 'relative' }}>
      <div style={{ height: '100%', overflow: 'auto', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: '6px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <Label>◆ The Cellar · {total.toLocaleString()} entries</Label>
            <div style={{ fontFamily: dFont.display, fontSize: 36, lineHeight: 1.02, fontStyle: 'italic', marginTop: 6 }}>
              Catalog
            </div>
          </div>
          <button style={{
            background: 'transparent', border: `1px solid ${DUSK.line}`, color: DUSK.ink,
            padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: dFont.mono, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
            Scan
          </button>
        </div>

        {/* Search with sort */}
        <div style={{ padding: '0 24px', marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
          <div style={{ border: `1px solid ${DUSK.line}`, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, background: DUSK.surf }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={DUSK.ink3} strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <span style={{ fontFamily: dFont.body, fontStyle: 'italic', fontSize: 14, color: DUSK.ink3 }}>
              flavor, distillery, bottle…
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setSortOpen(o => !o)} style={{
              background: DUSK.surf, color: DUSK.ink, border: `1px solid ${DUSK.line}`,
              padding: '11px 12px', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: dFont.mono, fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', height: '100%',
            }}>
              {sort} <svg width="9" height="9" viewBox="0 0 10 10"><path d="M1 3 L5 7 L9 3" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
            </button>
            {sortOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 20, background: DUSK.surfAlt, border: `1px solid ${DUSK.lineStrong}`, minWidth: 140, boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
                {SORTS.map(s => (
                  <div key={s} onClick={() => { setSort(s); setSortOpen(false); }} style={{
                    padding: '10px 12px', fontFamily: dFont.mono, fontSize: 10, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: s === sort ? accent : DUSK.ink2, cursor: 'pointer',
                    borderBottom: `1px solid ${DUSK.line}`,
                  }}>{s}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category multi-select chips */}
        <div style={{ padding: '0 24px', marginBottom: 10, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {CATS.map((c) => {
            const on = activeCats.has(c);
            return (
              <div key={c} onClick={() => toggleCat(c)} style={{
                padding: '7px 12px',
                border: `1px solid ${on ? accent : DUSK.line}`,
                background: on ? accent : 'transparent',
                color: on ? DUSK.bg : DUSK.ink2,
                fontFamily: dFont.mono, fontSize: 9.5, letterSpacing: '0.16em',
                textTransform: 'uppercase', whiteSpace: 'nowrap', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {c} {on && c !== 'All' && <span style={{ opacity: 0.7 }}>×</span>}
              </div>
            );
          })}
        </div>

        {/* Price + Region */}
        <div style={{ padding: '0 24px', marginBottom: 10 }}>
          <Label style={{ fontSize: 8.5, color: DUSK.ink3, marginBottom: 6 }}>Price</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {PRICE.map(([l, v]) => (
              <div key={v} onClick={() => setPrice(v)} style={{
                padding: '6px 10px',
                border: `1px solid ${price === v ? accent : DUSK.line}`,
                background: price === v ? accent : 'transparent',
                color: price === v ? DUSK.bg : DUSK.ink2,
                fontFamily: dFont.mono, fontSize: 9, letterSpacing: '0.14em',
                textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
              }}>{l}</div>
            ))}
          </div>
          <Label style={{ fontSize: 8.5, color: DUSK.ink3, marginBottom: 6 }}>Region</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div onClick={() => setRegions(new Set())} style={{
              padding: '6px 10px',
              border: `1px solid ${regions.size === 0 ? accent : DUSK.line}`,
              background: regions.size === 0 ? accent : 'transparent',
              color: regions.size === 0 ? DUSK.bg : DUSK.ink2,
              fontFamily: dFont.mono, fontSize: 9, letterSpacing: '0.14em',
              textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
            }}>All Regions</div>
            {REGIONS.map(r => {
              const on = regions.has(r);
              return (
                <div key={r} onClick={() => toggleRegion(r)} style={{
                  padding: '6px 10px',
                  border: `1px solid ${on ? accent : DUSK.line}`,
                  background: on ? accent : 'transparent',
                  color: on ? DUSK.bg : DUSK.ink2,
                  fontFamily: dFont.mono, fontSize: 9, letterSpacing: '0.14em',
                  textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {r} {on && <span style={{ opacity: 0.7 }}>×</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active-view summary */}
        <div style={{ margin: '18px 24px 18px', padding: '12px 14px', borderTop: `1px solid ${DUSK.line}`, borderBottom: `1px solid ${DUSK.line}` }}>
          <Label accent={accent} style={{ fontSize: 8.5 }}>Active discovery view</Label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6, gap: 12 }}>
            <div style={{ fontFamily: dFont.body, fontSize: 14, color: DUSK.ink2, fontStyle: 'italic', lineHeight: 1.35 }}>
              {activeDescriptions.length === 0 ? 'Showing the full catalog.' : `Showing bottles ${activeDescriptions.join(', ')}.`}
            </div>
            <div style={{ fontFamily: dFont.display, fontSize: 22, fontStyle: 'italic', color: accent, whiteSpace: 'nowrap' }}>
              {matching}
            </div>
          </div>
          {activeCount > 0 && (
            <div onClick={() => { setActiveCats(new Set(['All'])); setRegions(new Set()); setPrice('any'); }} style={{ fontFamily: dFont.mono, fontSize: 9, color: accent, letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 6, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>
              Reset all
            </div>
          )}
        </div>

        {/* List */}
        <div style={{ padding: '0 24px' }}>
          {items.map(([name, type, proof, price, rating, shade, region], i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '54px 1fr auto', gap: 14, alignItems: 'center',
              padding: '16px 0', borderBottom: i < items.length - 1 ? `1px solid ${DUSK.line}` : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Bottle h={60} accent={accent} shade={shade} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: dFont.display, fontSize: 17, fontStyle: 'italic', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ fontFamily: dFont.mono, fontSize: 9, color: DUSK.ink3, marginTop: 4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {type} · {proof} · {region}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, color: accent }}>
                  {[1,1,1,1,rating > 4.4 ? 1 : 0].map((f,j) => <Star key={j} filled={!!f} size={9}/>)}
                  <span style={{ fontFamily: dFont.mono, fontSize: 9, color: DUSK.ink3, marginLeft: 4 }}>{rating}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: dFont.display, fontSize: 18, color: accent }}>{price}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div style={{ padding: '24px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Label accent={accent} style={{ fontSize: 8.5 }}>1–{items.length} of {matching}</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ border: `1px solid ${DUSK.line}`, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M6 2 L3 5 L6 8" stroke={DUSK.ink} strokeWidth="1.3" fill="none"/></svg>
            </div>
            <Label style={{ fontSize: 9, color: DUSK.ink2 }}>Page 01 / 15</Label>
            <div style={{ border: `1px solid ${DUSK.line}`, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M4 2 L7 5 L4 8" stroke={DUSK.ink} strokeWidth="1.3" fill="none"/></svg>
            </div>
          </div>
        </div>
      </div>
      <TabBar active="catalog" />
    </div>
  );
}

// DETAIL
function Detail({ tweaks }) {
  const accent = tweaks.accentA;
  return (
    <div style={{ height: '100%', background: DUSK.bg, color: DUSK.ink, position: 'relative' }}>
      <div style={{ height: '100%', overflow: 'auto', paddingBottom: 100 }}>
        <div style={{ padding: '4px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: 32, height: 32, border: `1px solid ${DUSK.line}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={DUSK.ink} strokeWidth="2"><path d="M15 6l-6 6 6 6"/></svg>
          </div>
          <Label>Entry · No. 0482</Label>
          <div style={{ width: 32, height: 32, border: `1px solid ${DUSK.line}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={DUSK.ink} strokeWidth="2"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
          </div>
        </div>
        <div style={{ position: 'relative', padding: '12px 24px 24px', display: 'flex', justifyContent: 'center', background: `radial-gradient(ellipse at center top, color-mix(in srgb, ${accent} 8%, transparent), transparent 60%)` }}>
          <Bottle h={240} accent={accent} shade="amber" />
        </div>
        <div style={{ padding: '0 24px 22px', textAlign: 'center' }}>
          <Label accent={accent}>◆ Bourbon · Kentucky · 2018</Label>
          <div style={{ fontFamily: dFont.display, fontSize: 34, lineHeight: 1.05, fontStyle: 'italic', marginTop: 8 }}>
            Elkhorn Creek<br/>Single Barrel
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12, color: accent }}>
            {[1,1,1,1,0].map((f,i) => <Star key={i} filled={!!f} size={13}/>)}
            <span style={{ fontFamily: dFont.mono, fontSize: 10, color: DUSK.ink2, marginLeft: 6 }}>4.3 · 218 notes</span>
          </div>
        </div>
        <div style={{ margin: '0 24px', borderTop: `1px solid ${DUSK.line}`, borderBottom: `1px solid ${DUSK.line}`, padding: '14px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[['Proof', '94'], ['Age', '8 yr'], ['Price', '$89']].map(([k,v], i) => (
            <div key={k} style={{ textAlign: 'center', borderLeft: i > 0 ? `1px solid ${DUSK.line}` : 'none' }}>
              <Label style={{ fontSize: 8.5 }}>{k}</Label>
              <div style={{ fontFamily: dFont.display, fontSize: 22, fontStyle: 'italic', marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '22px 24px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button style={{ background: accent, color: DUSK.bg, border: 'none', padding: '14px', fontFamily: dFont.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', cursor: 'pointer' }}>Want to try</button>
          <button style={{ background: 'transparent', color: DUSK.ink, border: `1px solid ${DUSK.line}`, padding: '14px', fontFamily: dFont.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', cursor: 'pointer' }}>+ Review</button>
        </div>
        <div style={{ padding: '24px 24px 10px' }}>
          <Label accent={accent}>◆ Flavor Profile</Label>
        </div>
        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['Sweetness', 7], ['Oak', 8], ['Spice', 5], ['Smoke', 2], ['Fruit', 6], ['Heat', 4]].map(([k, v]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 22px', gap: 12, alignItems: 'center' }}>
              <Label style={{ fontSize: 9 }}>{k}</Label>
              <div style={{ height: 2, background: DUSK.line, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: 2, width: `${v*10}%`, background: accent }} />
                {[...Array(10)].map((_, i) => (
                  <div key={i} style={{ position: 'absolute', left: `${i*10}%`, top: -2, width: 1, height: 6, background: DUSK.line }} />
                ))}
              </div>
              <div style={{ fontFamily: dFont.mono, fontSize: 10, color: DUSK.ink2, textAlign: 'right' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '24px 24px 0' }}>
          <Label accent={accent}>◆ Tasting Notes</Label>
          <div style={{ fontFamily: dFont.body, fontSize: 17, lineHeight: 1.55, fontStyle: 'italic', marginTop: 12, color: DUSK.ink2 }}>
            <div><span style={{ fontFamily: dFont.mono, fontStyle: 'normal', fontSize: 9, letterSpacing: '0.18em', color: accent, textTransform: 'uppercase', marginRight: 8 }}>Nose</span>Toasted brown sugar, clove, leather.</div>
            <div style={{ marginTop: 8 }}><span style={{ fontFamily: dFont.mono, fontStyle: 'normal', fontSize: 9, letterSpacing: '0.18em', color: accent, textTransform: 'uppercase', marginRight: 8 }}>Palate</span>Dark honey, orchard fruit, creamy oak.</div>
            <div style={{ marginTop: 8 }}><span style={{ fontFamily: dFont.mono, fontStyle: 'normal', fontSize: 9, letterSpacing: '0.18em', color: accent, textTransform: 'uppercase', marginRight: 8 }}>Finish</span>Long, quiet, warming. Dusted with vanilla.</div>
          </div>
        </div>
      </div>
      <TabBar active="catalog" />
    </div>
  );
}

// ────────────────────────────────────────────────
// PROFILE — persona pillars, Collector Signal, Flavor DNA radar,
// hero Top Shelf, featured journal entry
// ────────────────────────────────────────────────
function Profile({ tweaks }) {
  const accent = tweaks.accentA;

  const flavorDNA = [
    { k: 'SWEET', v: 7.2 }, { k: 'OAK', v: 8.1 }, { k: 'SPICE', v: 6.4 },
    { k: 'SMOKE', v: 3.2 }, { k: 'FRUIT', v: 6.8 }, { k: 'HEAT', v: 5.1 },
    { k: 'NUTTY', v: 5.7 }, { k: 'FLORAL', v: 2.9 },
  ];
  const leadingNotes = [...flavorDNA].sort((a,b) => b.v - a.v).slice(0, 3);

  const pillars = [
    ['Favorite spirit', 'Bourbon', 'The bottle lane they identify with most.'],
    ['Proof persona', 'Full Bodied', 'Appreciates a solid proof.'],
    ['Flavor DNA', 'Oak · Sweet · Fruit', 'Dominant notes from tasted bottles.'],
  ];

  return (
    <div style={{ height: '100%', background: DUSK.bg, color: DUSK.ink, position: 'relative' }}>
      <div style={{ height: '100%', overflow: 'auto', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: '6px 24px 20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, right: 24, opacity: 0.3 }}>
            <Compass size={48} color={accent} op={0.9} />
          </div>
          <Label>◆ Member Persona</Label>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 999, border: `1px solid ${accent}`, background: `color-mix(in srgb, ${accent} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: dFont.display, fontSize: 28, fontStyle: 'italic', color: accent, flexShrink: 0 }}>
              Z
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: dFont.display, fontSize: 30, lineHeight: 1.02, fontStyle: 'italic' }}>
                Zachary Brenner
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                <div style={{ border: `1px solid ${accent}`, background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent, padding: '4px 9px', fontFamily: dFont.mono, fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                  ✦ Bourbon
                </div>
                <div style={{ border: `1px solid ${DUSK.line}`, color: DUSK.ink3, padding: '4px 9px', fontFamily: dFont.mono, fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  Since Jun 2023
                </div>
                <div style={{ border: `1px solid ${DUSK.line}`, color: DUSK.ink3, padding: '4px 9px', fontFamily: dFont.mono, fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  ◉ Public
                </div>
              </div>
            </div>
          </div>
          <div style={{ fontFamily: dFont.body, fontSize: 15.5, fontStyle: 'italic', color: DUSK.ink2, marginTop: 12, lineHeight: 1.4 }}>
            Bourbon romantic. Rye apologist. Chasing honeyed wheat and long finishes.
          </div>

          {/* Persona pillars */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 16 }}>
            {pillars.map(([t, v, n], i) => (
              <div key={t} style={{ border: `1px solid ${DUSK.line}`, padding: '12px 14px', background: DUSK.surf, display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, border: `1px solid ${accent}`, background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: dFont.mono, fontSize: 10, fontWeight: 600 }}>
                  0{i+1}
                </div>
                <div>
                  <Label style={{ fontSize: 8, color: DUSK.ink3 }}>{t}</Label>
                  <div style={{ fontFamily: dFont.display, fontSize: 17, fontStyle: 'italic', lineHeight: 1.15, marginTop: 4 }}>{v}</div>
                  <div style={{ fontFamily: dFont.body, fontSize: 13, fontStyle: 'italic', color: DUSK.ink3, marginTop: 3, lineHeight: 1.35 }}>{n}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collector Signal */}
        <div style={{ margin: '0 24px 24px', border: `1px solid ${accent}`, background: `color-mix(in srgb, ${accent} 5%, ${DUSK.surf})`, padding: '16px 16px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <Label accent={accent} style={{ fontSize: 8.5 }}>◆ Identity Layer</Label>
              <div style={{ fontFamily: dFont.display, fontSize: 18, fontStyle: 'italic', marginTop: 2 }}>Collector Signal</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.4"><path d="M7 21h10l-1-5H8zM12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/></svg>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['124', 'Tasted', '✓'], ['48', 'Wishlist', '✦'], ['312', 'Followers', '◉'], ['4.1', 'Avg score', '★']].map(([v, l, g]) => (
              <div key={l} style={{ border: `1px solid ${DUSK.line}`, padding: '10px 12px', background: DUSK.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Label style={{ fontSize: 8, color: DUSK.ink3 }}>{l}</Label>
                  <div style={{ fontFamily: dFont.display, fontSize: 20, fontStyle: 'italic', marginTop: 2 }}>{v}</div>
                </div>
                <div style={{ fontFamily: dFont.mono, fontSize: 14, color: accent }}>{g}</div>
              </div>
            ))}
          </div>
          {/* Proof persona strip */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${DUSK.line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Label style={{ fontSize: 8, color: DUSK.ink3 }}>Proof tolerance</Label>
              <Label style={{ fontSize: 8, color: accent }}>102° avg</Label>
            </div>
            <div style={{ marginTop: 8, height: 4, background: DUSK.line, position: 'relative', borderRadius: 2 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: 4, width: '52%', background: accent, borderRadius: 2 }} />
              {[0, 0.33, 0.66, 1].map((t, i) => (
                <div key={i} style={{ position: 'absolute', left: `calc(${t*100}% - 0.5px)`, top: -3, width: 1, height: 10, background: DUSK.lineStrong }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: dFont.mono, fontSize: 8, color: DUSK.ink3, letterSpacing: '0.14em' }}>
              <span>80</span><span>100</span><span>120</span><span>140+</span>
            </div>
          </div>
        </div>

        {/* Top Shelf — crown + numbered */}
        <div style={{ padding: '0 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <Label accent={accent}>◆ Signature Bottles</Label>
            <div style={{ fontFamily: dFont.display, fontSize: 22, fontStyle: 'italic', marginTop: 2 }}>Top Shelf</div>
          </div>
          <Label>3 of 5</Label>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          {/* Crown bottle */}
          <div style={{ border: `1px solid ${accent}`, background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 10%, ${DUSK.surf}), ${DUSK.surf})`, padding: '18px 16px', position: 'relative', overflow: 'hidden', marginBottom: 8, display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, alignItems: 'center' }}>
            <div style={{ position: 'absolute', right: 10, top: 4, fontFamily: dFont.display, fontSize: 56, color: accent, opacity: 0.1, lineHeight: 1 }}>01</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Bottle h={110} accent={accent} shade="amber" />
            </div>
            <div>
              <div style={{ display: 'inline-block', border: `1px solid ${accent}`, background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, padding: '3px 8px', fontFamily: dFont.mono, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                Crown Bottle
              </div>
              <div style={{ fontFamily: dFont.display, fontSize: 20, fontStyle: 'italic', lineHeight: 1.1 }}>Elkhorn Creek SB</div>
              <Label style={{ fontSize: 8.5, color: DUSK.ink3, marginTop: 4 }}>Bourbon · Kentucky · 94 PR</Label>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <div style={{ border: `1px solid ${DUSK.line}`, padding: '4px 8px', fontFamily: dFont.mono, fontSize: 9, color: DUSK.ink2 }}>94°</div>
                <div style={{ border: `1px solid ${DUSK.line}`, padding: '4px 8px', fontFamily: dFont.mono, fontSize: 9, color: accent }}>$89</div>
              </div>
            </div>
          </div>
          {/* Pair */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['Stagg Jr.', 'dark', '02', '130 PR'], ['Redbreast 12', 'light', '03', '80 PR']].map(([n, shade, no, pr]) => (
              <div key={n} style={{ border: `1px solid ${DUSK.line}`, background: DUSK.surf, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, right: 8, fontFamily: dFont.mono, fontSize: 9, color: DUSK.ink3 }}>{no}</div>
                <Bottle h={70} accent={accent} shade={shade} />
                <div style={{ fontFamily: dFont.display, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.1 }}>{n}</div>
                <div style={{ fontFamily: dFont.mono, fontSize: 8, color: DUSK.ink3, letterSpacing: '0.14em' }}>{pr}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Flavor DNA radar + hallmarks */}
        <div style={{ padding: '0 24px 10px' }}>
          <Label accent={accent}>◆ Flavor DNA</Label>
          <div style={{ fontFamily: dFont.display, fontSize: 22, fontStyle: 'italic', marginTop: 2 }}>A mapped palate signature</div>
          <div style={{ fontFamily: dFont.mono, fontSize: 9, color: DUSK.ink3, marginTop: 4, letterSpacing: '0.14em' }}>
            Built from 124 tasted bottles
          </div>
        </div>
        <div style={{ padding: '14px 24px 24px', border: 'none' }}>
          <div style={{ background: DUSK.surf, border: `1px solid ${DUSK.line}`, padding: '16px 12px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FlavorRadar data={flavorDNA} accent={accent} ink3={DUSK.ink3} line={DUSK.line} />
          </div>
          {/* Hallmarks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {leadingNotes.map((n, i) => (
              <div key={n.k} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 10, alignItems: 'center', padding: '8px 12px', border: `1px solid ${DUSK.line}`, background: DUSK.surf }}>
                <div style={{ fontFamily: dFont.mono, fontSize: 9, color: DUSK.ink3 }}>#{i+1}</div>
                <div style={{ fontFamily: dFont.display, fontSize: 15, fontStyle: 'italic' }}>{n.k.charAt(0) + n.k.slice(1).toLowerCase()}</div>
                <div style={{ width: 60, height: 2, background: DUSK.line, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: 2, width: `${n.v*10}%`, background: accent }} />
                </div>
                <div style={{ fontFamily: dFont.display, fontSize: 15, color: accent, fontStyle: 'italic' }}>{n.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Journal — featured + two follows */}
        <div style={{ padding: '0 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <Label accent={accent}>◆ Recent Tasting Opinions</Label>
            <div style={{ fontFamily: dFont.display, fontSize: 22, fontStyle: 'italic', marginTop: 2 }}>Journal</div>
          </div>
          <Label>3 entries</Label>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          {/* Featured */}
          <div style={{ border: `1px solid ${accent}`, background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 8%, ${DUSK.surf}), ${DUSK.surf})`, padding: '16px', position: 'relative', marginBottom: 10 }}>
            <div style={{ position: 'absolute', inset: 0, top: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accent} 50%, transparent)`, opacity: 0.5 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: dFont.display, fontSize: 20, fontStyle: 'italic', lineHeight: 1.1 }}>Elkhorn Creek SB</div>
                <Label style={{ fontSize: 8, color: DUSK.ink3, marginTop: 4 }}>Buffalo Trace · 94 PR · Bourbon</Label>
              </div>
              <div style={{ border: `1px solid ${accent}`, background: `color-mix(in srgb, ${accent} 10%, transparent)`, padding: '4px 8px', display: 'flex', gap: 2, color: accent, flexShrink: 0 }}>
                {[1,1,1,1,0].map((f,i) => <Star key={i} filled={!!f} size={9}/>)}
              </div>
            </div>
            <div style={{ fontFamily: dFont.body, fontSize: 14.5, fontStyle: 'italic', color: DUSK.ink2, lineHeight: 1.45, marginTop: 10 }}>
              Poured neat, it opens with clove and dark honey. A second glass reveals stone fruit, leather, and that
              long, quiet finish I keep chasing. This is the one.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <Label style={{ fontSize: 8, color: DUSK.ink3 }}>2 days ago</Label>
              <div style={{ border: `1px solid ${accent}`, background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent, padding: '3px 8px', fontFamily: dFont.mono, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                Featured opinion
              </div>
            </div>
          </div>
          {/* Follow-ups */}
          {[
            ['Redbreast 12', 'Jameson · 80 PR · Irish', 4, '5 days ago', 'Rounded, honeyed, clean. A safe keep.'],
            ['Hibiki Harmony', 'Suntory · 86 PR · Japanese', 4, '1 week ago', 'Floral top, soft oak, nimble finish.'],
          ].map(([n, meta, r, ago, text], i) => (
            <div key={i} style={{ border: `1px solid ${DUSK.line}`, background: DUSK.surf, padding: '14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: dFont.display, fontSize: 17, fontStyle: 'italic', lineHeight: 1.1 }}>{n}</div>
                  <Label style={{ fontSize: 8, color: DUSK.ink3, marginTop: 4 }}>{meta}</Label>
                </div>
                <div style={{ display: 'flex', gap: 2, color: accent }}>
                  {[1,1,1,1,0].map((f,j) => <Star key={j} filled={j < r} size={9}/>)}
                </div>
              </div>
              <div style={{ fontFamily: dFont.body, fontSize: 13.5, fontStyle: 'italic', color: DUSK.ink2, lineHeight: 1.4, marginTop: 8 }}>
                {text}
              </div>
              <Label style={{ fontSize: 8, color: DUSK.ink3, marginTop: 10 }}>{ago}</Label>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="profile" />
    </div>
  );
}

window.DuskScreens = {
  onboarding: Onboarding,
  home: Home,
  catalog: Catalog,
  detail: Detail,
  profile: Profile,
};
