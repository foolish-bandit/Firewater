// SundownScreens.jsx — Direction B: bone paper, ink, terracotta/sagebrush
// Fonts: Old Standard TT (headlines/letterpress), Tenor Sans (body), JetBrains Mono (labels)

const SUND = {
  bg: '#F2ECDF',
  surf: '#E8E0CF',
  surfAlt: '#DDD2BB',
  ink: '#231D16',
  ink2: 'rgba(35,29,22,0.68)',
  ink3: 'rgba(35,29,22,0.42)',
  line: 'rgba(35,29,22,0.2)',
  lineStrong: 'rgba(35,29,22,0.35)',
};

const sFont = {
  display: "'Old Standard TT', 'Cormorant', serif",
  body: "'Tenor Sans', 'Cormorant', serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

const sLabel = ({ children, style, accent }) => (
  <div style={{
    fontFamily: sFont.mono, fontSize: 9.5, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: accent || SUND.ink3, ...style,
  }}>{children}</div>
);

const SStar = ({ filled = true, size = 11, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 10 10">
    <path d="M5 0.5 L6.2 3.7 L9.5 3.9 L6.9 6 L7.8 9.2 L5 7.4 L2.2 9.2 L3.1 6 L0.5 3.9 L3.8 3.7 Z"
      fill={filled ? color : 'none'} stroke={color} strokeWidth="0.5"/>
  </svg>
);

const Contour = ({ color = SUND.ink, op = 0.1 }) => (
  <svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="none" style={{ opacity: op }}>
    {[...Array(8)].map((_, i) => (
      <ellipse key={i} cx="200" cy="300" rx={40 + i * 30} ry={25 + i * 18} fill="none" stroke={color} strokeWidth="0.4" />
    ))}
  </svg>
);

const SCompass = ({ size = 32, color = 'currentColor', op = 0.9 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={{ opacity: op }}>
    <circle cx="16" cy="16" r="14" fill="none" stroke={color} strokeWidth="0.5" />
    <circle cx="16" cy="16" r="10" fill="none" stroke={color} strokeWidth="0.3" strokeDasharray="1 1" />
    {[0, 90, 180, 270].map(a => (
      <path key={a} d="M16 2 L18 16 L16 30 L14 16 Z" fill={color} transform={`rotate(${a} 16 16)`} />
    ))}
    {[45, 135, 225, 315].map(a => (
      <path key={a} d="M16 6 L17 16 L16 26 L15 16 Z" fill={color} opacity="0.4" transform={`rotate(${a} 16 16)`} />
    ))}
  </svg>
);

const SBottle = ({ h = 140, accent = '#B24A2C', shade = 'amber' }) => {
  const fills = {
    amber: 'linear-gradient(180deg, #8a5a2b 0%, #b07a3b 55%, #d4a85a 100%)',
    dark: 'linear-gradient(180deg, #3d1f0a 0%, #6b3a12 55%, #8c5820 100%)',
    clear: 'linear-gradient(180deg, #7a6f5e 0%, #a89a82 55%, #ccbfa5 100%)',
    light: 'linear-gradient(180deg, #b08f52 0%, #d4b278 55%, #e8d4a0 100%)',
  };
  const w = h * 0.34;
  return (
    <div style={{ width: w, height: h, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: w * 0.24, height: h * 0.22, background: fills[shade], borderRadius: '2px 2px 0 0' }} />
      <div style={{ width: w * 0.9, height: h * 0.1, background: fills[shade], clipPath: 'polygon(0 100%, 15% 0, 85% 0, 100% 100%)' }} />
      <div style={{
        width: w, height: h * 0.68, background: fills[shade],
        borderRadius: '2px 2px 4px 4px', position: 'relative',
        boxShadow: 'inset 2px 0 4px rgba(255,255,255,0.2), inset -2px 0 8px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          position: 'absolute', top: '28%', left: '10%', right: '10%', bottom: '18%',
          background: '#F2ECDF', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 3, padding: 4,
          border: `0.5px solid ${SUND.ink}`,
        }}>
          <div style={{ width: '80%', height: 1, background: accent }} />
          <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 9, color: SUND.ink }}>★</div>
          <div style={{ width: '60%', height: 1, background: SUND.ink }} />
        </div>
      </div>
    </div>
  );
};

// Sundown radar — same logic as Dusk, letterpress styling
const SFlavorRadar = ({ data, accent, ink, line }) => {
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
        }).join(' ')} fill="none" stroke={line} strokeWidth="0.4" strokeDasharray={r === 10 ? '' : '1 1.5'} />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={line} strokeWidth="0.4" />;
      })}
      <polygon points={polyPts} fill={accent} fillOpacity="0.25" stroke={accent} strokeWidth="1.2" />
      {data.map((d, i) => {
        const [x, y] = point(i, d.v);
        return <circle key={i} cx={x} cy={y} r="1.8" fill={accent} />;
      })}
      {data.map((d, i) => {
        const [x, y] = point(i, 11.8);
        return (
          <text key={i} x={x} y={y} fill={ink} fontSize="7.5" fontFamily="JetBrains Mono" fontWeight="600" textAnchor="middle" dominantBaseline="middle" style={{ letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {d.k}
          </text>
        );
      })}
    </svg>
  );
};

const STabBar = ({ active = 'discover' }) => {
  const items = [
    ['discover', 'Discover', <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 3 L14 12 L12 21 L10 12 Z" fill="currentColor"/></svg>],
    ['catalog', 'Catalog', <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 5h16M4 12h16M4 19h16"/></svg>],
    ['lists', 'Lists', <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 4h9l4 4v12H6z"/><path d="M15 4v4h4"/></svg>],
    ['profile', 'Profile', <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="9" r="3.5"/><path d="M5 20c1-4 5-6 7-6s6 2 7 6"/></svg>],
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
      background: 'rgba(242,236,223,0.94)', backdropFilter: 'blur(14px)',
      borderTop: `1.5px solid ${SUND.ink}`, paddingBottom: 22, paddingTop: 10,
      display: 'flex', justifyContent: 'space-around',
    }}>
      {items.map(([k, l, icon]) => (
        <div key={k} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: active === k ? 'var(--accentB)' : SUND.ink3,
        }}>
          {icon}
          <div style={{ fontFamily: sFont.mono, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>{l}</div>
        </div>
      ))}
    </div>
  );
};

const Flourish = ({ color = SUND.ink, size = 120 }) => (
  <svg width={size} height="10" viewBox="0 0 120 10">
    <line x1="0" y1="5" x2="50" y2="5" stroke={color} strokeWidth="0.5"/>
    <circle cx="54" cy="5" r="1" fill={color} />
    <path d="M60 5 L64 2 L68 5 L64 8 Z" fill={color} />
    <circle cx="66" cy="5" r="1" fill={color} />
    <line x1="70" y1="5" x2="120" y2="5" stroke={color} strokeWidth="0.5"/>
  </svg>
);

// ─── ONBOARDING (unchanged) ───
function SOnboarding({ tweaks }) {
  const accent = tweaks.accentB;
  return (
    <div style={{ height: '100%', background: SUND.bg, color: SUND.ink, padding: '24px 28px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Contour color={accent} op={0.08} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        {sLabel({ children: 'Step 02 / 04' })}
        {sLabel({ children: 'Skip', style: { color: SUND.ink2 } })}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 12, position: 'relative' }}>
        {[1,0,0,0].map((on,i) => (
          <div key={i} style={{ flex: 1, height: 2, background: i < 2 ? accent : SUND.lineStrong }} />
        ))}
      </div>
      <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
        <SCompass size={40} color={accent} op={0.85} />
        <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.015em' }}>
          What fire are<br/>you chasing?
        </div>
        <Flourish color={accent} size={90} />
        <div style={{ fontFamily: sFont.body, fontSize: 15, lineHeight: 1.55, color: SUND.ink2, maxWidth: 300 }}>
          Pick the spirits you reach for. We'll tune your catalog, recommendations, and tasting notes accordingly.
        </div>
      </div>
      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, position: 'relative' }}>
        {[['Bourbon', true], ['Rye', true], ['Scotch', false], ['Japanese', true], ['Tequila', false], ['Mezcal', false], ['Gin', false], ['Rum', false]].map(([n, on]) => (
          <div key={n} style={{
            padding: '14px',
            border: `1px solid ${on ? accent : SUND.line}`,
            background: on ? `color-mix(in srgb, ${accent} 14%, transparent)` : 'transparent',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 18, color: on ? accent : SUND.ink }}>{n}</span>
            {on && <div style={{ width: 6, height: 6, background: accent, transform: 'rotate(45deg)' }} />}
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button style={{
        background: accent, color: '#FAF4E4', border: 'none',
        padding: '18px 20px', fontFamily: sFont.mono, fontSize: 11,
        letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 600,
        cursor: 'pointer', position: 'relative',
      }}>
        Continue →
      </button>
      <div style={{ height: 28 }} />
    </div>
  );
}

// ─── HOME (unchanged) ───
function SHome({ tweaks }) {
  const accent = tweaks.accentB;
  return (
    <div style={{ height: '100%', background: SUND.bg, color: SUND.ink, position: 'relative', overflow: 'hidden' }}>
      <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110 }}>
        <div style={{ padding: '8px 24px 12px', borderBottom: `2px solid ${SUND.ink}`, borderTop: `1px solid ${SUND.ink}`, margin: '0 20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {sLabel({ children: 'Est. 2024' })}
            {sLabel({ children: 'Vol. VII — Wed.' })}
          </div>
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 40, letterSpacing: '0.04em', lineHeight: 1 }}>
              FIRE<span style={{ color: accent }}>·</span>WATER
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
            <Flourish color={SUND.ink} size={140} />
          </div>
        </div>
        <div style={{ padding: '18px 24px 18px' }}>
          <div style={{ border: `1px solid ${SUND.line}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: '#FAF4E4' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SUND.ink3} strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <span style={{ fontFamily: sFont.body, fontSize: 15, color: SUND.ink3 }}>
              "smoky bourbon under $50"
            </span>
          </div>
        </div>
        <div style={{ padding: '0 24px 8px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
          {sLabel({ children: '◆  TONIGHT\'S POUR  ◆', accent: SUND.ink, style: { fontSize: 10 } })}
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
        </div>
        <div style={{ padding: '16px 24px 24px', display: 'grid', gridTemplateColumns: '120px 1fr', gap: 18, alignItems: 'end' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SBottle h={160} accent={accent} shade="amber" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sLabel({ children: 'Bourbon · Kentucky', accent })}
            <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 24, lineHeight: 1.1, marginTop: 4 }}>
              Elkhorn Creek<br/>Single Barrel
            </div>
            <div style={{ display: 'flex', gap: 4, color: accent, marginTop: 6 }}>
              {[1,1,1,1,0].map((f,i) => <SStar key={i} filled={!!f} size={11}/>)}
              <span style={{ fontFamily: sFont.mono, fontSize: 10, color: SUND.ink2, marginLeft: 4 }}>4.3 · 218</span>
            </div>
            <div style={{ fontFamily: sFont.body, fontSize: 14, lineHeight: 1.4, color: SUND.ink2, marginTop: 4 }}>
              Honeyed oak, orchard fruit, long quiet finish.
            </div>
          </div>
        </div>
        <div style={{ padding: '0 24px 8px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
          {sLabel({ children: '◆  VEINS OF SPIRIT  ◆', accent: SUND.ink, style: { fontSize: 10 } })}
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
        </div>
        <div style={{ padding: '16px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Bourbon', '482'], ['Scotch', '394'], ['Rye', '201'], ['Tequila', '316']].map(([n, c]) => (
            <div key={n} style={{
              border: `1.5px solid ${SUND.ink}`, padding: '14px 12px',
              background: '#FAF4E4',
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 20 }}>{n}</div>
              <div style={{ fontFamily: sFont.mono, fontSize: 10, color: SUND.ink3 }}>{c}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 24px 8px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
          {sLabel({ children: '◆  THE DISPATCH  ◆', accent: SUND.ink, style: { fontSize: 10 } })}
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
        </div>
        <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['A quiet case for wheated mash', '4 min'], ['Six ryes under fifty', 'Guide'], ['How finish wood rewrites palate', '6 min']].map(([t, tag], i) => (
            <div key={i} style={{ borderBottom: i < 2 ? `1px dashed ${SUND.line}` : 'none', paddingBottom: i < 2 ? 14 : 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10, alignItems: 'baseline' }}>
                <div style={{ fontFamily: sFont.mono, fontSize: 10, color: accent, fontWeight: 600 }}>{String(i+1).padStart(2,'0')}</div>
                <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>{t}</div>
                <div style={{ fontFamily: sFont.mono, fontSize: 9, color: SUND.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <STabBar active="discover" />
    </div>
  );
}

// ─── CATALOG — refreshed ───
function SCatalog({ tweaks }) {
  const accent = tweaks.accentB;
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
  const matching = 342;

  const activeDescriptions = [];
  if (!activeCats.has('All')) activeDescriptions.push(`in ${[...activeCats].join(', ')}`);
  if (regions.size > 0) activeDescriptions.push(`from ${[...regions].join(', ')}`);
  if (price !== 'any') {
    const pLabels = { 'under-50': 'under $50', 'under-100': 'under $100', 'over-100': '$100+' };
    activeDescriptions.push(pLabels[price]);
  }

  return (
    <div style={{ height: '100%', background: SUND.bg, color: SUND.ink, position: 'relative' }}>
      <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110 }}>
        {/* Masthead */}
        <div style={{ padding: '8px 24px 16px', borderBottom: `2px solid ${SUND.ink}`, margin: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            {sLabel({ children: 'The Cellar · 2,184 entries', accent: SUND.ink })}
            <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 38, lineHeight: 1, marginTop: 6 }}>
              Catalog
            </div>
          </div>
          <button style={{
            background: 'transparent', border: `1.5px solid ${SUND.ink}`, color: SUND.ink,
            padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: sFont.mono, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
            Scan
          </button>
        </div>

        {/* Search + sort */}
        <div style={{ padding: '16px 24px 12px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
          <div style={{ border: `1px solid ${SUND.line}`, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, background: '#FAF4E4' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SUND.ink3} strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <span style={{ fontFamily: sFont.body, fontSize: 14, color: SUND.ink3 }}>
              flavor, distillery, bottle…
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setSortOpen(o => !o)} style={{
              background: '#FAF4E4', color: SUND.ink, border: `1px solid ${SUND.line}`,
              padding: '11px 12px', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: sFont.mono, fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', height: '100%', fontWeight: 600,
            }}>
              {sort} <svg width="9" height="9" viewBox="0 0 10 10"><path d="M1 3 L5 7 L9 3" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
            </button>
            {sortOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 20, background: '#FAF4E4', border: `1.5px solid ${SUND.ink}`, minWidth: 140, boxShadow: '0 12px 30px rgba(0,0,0,0.18)' }}>
                {SORTS.map(s => (
                  <div key={s} onClick={() => { setSort(s); setSortOpen(false); }} style={{
                    padding: '10px 12px', fontFamily: sFont.mono, fontSize: 10, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: s === sort ? accent : SUND.ink2, cursor: 'pointer',
                    borderBottom: `1px dashed ${SUND.line}`, fontWeight: 600,
                  }}>{s}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div style={{ padding: '0 24px', marginBottom: 10, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {CATS.map((c) => {
            const on = activeCats.has(c);
            return (
              <div key={c} onClick={() => toggleCat(c)} style={{
                padding: '7px 12px',
                border: `1.5px solid ${on ? accent : SUND.line}`,
                background: on ? accent : 'transparent',
                color: on ? '#FAF4E4' : SUND.ink,
                fontFamily: sFont.mono, fontSize: 9.5, letterSpacing: '0.16em',
                textTransform: 'uppercase', whiteSpace: 'nowrap', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {c} {on && c !== 'All' && <span style={{ opacity: 0.75 }}>×</span>}
              </div>
            );
          })}
        </div>

        {/* Price + Region */}
        <div style={{ padding: '0 24px', marginBottom: 10 }}>
          {sLabel({ children: 'Price', style: { fontSize: 8.5, color: SUND.ink3, marginBottom: 6 } })}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {PRICE.map(([l, v]) => (
              <div key={v} onClick={() => setPrice(v)} style={{
                padding: '6px 10px',
                border: `1.5px solid ${price === v ? accent : SUND.line}`,
                background: price === v ? accent : 'transparent',
                color: price === v ? '#FAF4E4' : SUND.ink,
                fontFamily: sFont.mono, fontSize: 9, letterSpacing: '0.14em',
                textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
              }}>{l}</div>
            ))}
          </div>
          {sLabel({ children: 'Region', style: { fontSize: 8.5, color: SUND.ink3, marginBottom: 6 } })}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div onClick={() => setRegions(new Set())} style={{
              padding: '6px 10px',
              border: `1.5px solid ${regions.size === 0 ? accent : SUND.line}`,
              background: regions.size === 0 ? accent : 'transparent',
              color: regions.size === 0 ? '#FAF4E4' : SUND.ink,
              fontFamily: sFont.mono, fontSize: 9, letterSpacing: '0.14em',
              textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
            }}>All Regions</div>
            {REGIONS.map(r => {
              const on = regions.has(r);
              return (
                <div key={r} onClick={() => toggleRegion(r)} style={{
                  padding: '6px 10px',
                  border: `1.5px solid ${on ? accent : SUND.line}`,
                  background: on ? accent : 'transparent',
                  color: on ? '#FAF4E4' : SUND.ink,
                  fontFamily: sFont.mono, fontSize: 9, letterSpacing: '0.14em',
                  textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {r} {on && <span style={{ opacity: 0.75 }}>×</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active view strip */}
        <div style={{ margin: '18px 24px 18px', padding: '12px 14px', border: `1.5px solid ${SUND.ink}`, background: '#FAF4E4' }}>
          {sLabel({ children: 'Active discovery view', accent, style: { fontSize: 8.5 } })}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6, gap: 12 }}>
            <div style={{ fontFamily: sFont.body, fontSize: 14, color: SUND.ink2, lineHeight: 1.35 }}>
              {activeDescriptions.length === 0 ? 'Showing the full catalog.' : `Showing bottles ${activeDescriptions.join(', ')}.`}
            </div>
            <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 22, color: accent, whiteSpace: 'nowrap' }}>
              {matching}
            </div>
          </div>
          {activeCount > 0 && (
            <div onClick={() => { setActiveCats(new Set(['All'])); setRegions(new Set()); setPrice('any'); }} style={{ fontFamily: sFont.mono, fontSize: 9, color: accent, letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 6, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontWeight: 600 }}>
              Reset all
            </div>
          )}
        </div>

        {/* List */}
        <div style={{ padding: '0 24px' }}>
          {items.map(([name, type, proof, price, rating, shade, region], i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '54px 1fr auto', gap: 14, alignItems: 'center',
              padding: '14px 0', borderBottom: `1px dashed ${SUND.line}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <SBottle h={60} accent={accent} shade={shade} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 16, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ fontFamily: sFont.mono, fontSize: 9, color: SUND.ink3, marginTop: 4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {type} · {proof} · {region}
                </div>
                <div style={{ display: 'flex', gap: 3, marginTop: 5, color: accent }}>
                  {[1,1,1,1,rating > 4.4 ? 1 : 0].map((f,j) => <SStar key={j} filled={!!f} size={9}/>)}
                  <span style={{ fontFamily: sFont.mono, fontSize: 9, color: SUND.ink3, marginLeft: 4 }}>{rating}</span>
                </div>
              </div>
              <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 17, color: accent, textAlign: 'right' }}>{price}</div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div style={{ padding: '24px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          {sLabel({ children: `1–${items.length} of ${matching}`, accent, style: { fontSize: 8.5 } })}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ border: `1.5px solid ${SUND.ink}`, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M6 2 L3 5 L6 8" stroke={SUND.ink} strokeWidth="1.3" fill="none"/></svg>
            </div>
            {sLabel({ children: 'Page 01 / 15', style: { fontSize: 9, color: SUND.ink2 } })}
            <div style={{ border: `1.5px solid ${SUND.ink}`, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M4 2 L7 5 L4 8" stroke={SUND.ink} strokeWidth="1.3" fill="none"/></svg>
            </div>
          </div>
        </div>
      </div>
      <STabBar active="catalog" />
    </div>
  );
}

// ─── DETAIL (unchanged) ───
function SDetail({ tweaks }) {
  const accent = tweaks.accentB;
  return (
    <div style={{ height: '100%', background: SUND.bg, color: SUND.ink, position: 'relative' }}>
      <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110 }}>
        <div style={{ padding: '4px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: 32, height: 32, border: `1.5px solid ${SUND.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={SUND.ink} strokeWidth="2"><path d="M15 6l-6 6 6 6"/></svg>
          </div>
          {sLabel({ children: 'Entry · No. 0482', accent: SUND.ink })}
          <div style={{ width: 32, height: 32, border: `1.5px solid ${SUND.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={SUND.ink} strokeWidth="2"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
          </div>
        </div>
        <div style={{ padding: '12px 24px 20px', display: 'flex', justifyContent: 'center', background: `radial-gradient(ellipse at center 20%, color-mix(in srgb, ${accent} 12%, transparent), transparent 65%)`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <SCompass size={220} color={SUND.ink} op={0.08} />
          </div>
          <SBottle h={240} accent={accent} shade="amber" />
        </div>
        <div style={{ padding: '0 24px 20px', textAlign: 'center' }}>
          {sLabel({ children: '◆ Bourbon · Kentucky · 2018', accent })}
          <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.01em', marginTop: 10 }}>
            Elkhorn Creek<br/>Single Barrel
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <Flourish color={accent} size={100} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 12, color: accent }}>
            {[1,1,1,1,0].map((f,i) => <SStar key={i} filled={!!f} size={13}/>)}
            <span style={{ fontFamily: sFont.mono, fontSize: 10, color: SUND.ink2, marginLeft: 6 }}>4.3 · 218 notes</span>
          </div>
        </div>
        <div style={{ margin: '0 24px', border: `1.5px solid ${SUND.ink}`, padding: '14px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[['Proof', '94'], ['Age', '8 yr'], ['Price', '$89']].map(([k, v], i) => (
            <div key={k} style={{ textAlign: 'center', borderLeft: i > 0 ? `1px solid ${SUND.line}` : 'none' }}>
              {sLabel({ children: k, style: { fontSize: 8.5 } })}
              <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 22, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '20px 24px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button style={{ background: accent, color: '#FAF4E4', border: 'none', padding: '14px', fontFamily: sFont.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', cursor: 'pointer' }}>Want to try</button>
          <button style={{ background: 'transparent', color: SUND.ink, border: `1.5px solid ${SUND.ink}`, padding: '14px', fontFamily: sFont.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', cursor: 'pointer' }}>+ Review</button>
        </div>
        <div style={{ padding: '22px 24px 10px' }}>
          {sLabel({ children: '◆ Flavor Profile', accent: SUND.ink, style: { fontSize: 10 } })}
        </div>
        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['Sweetness', 7], ['Oak', 8], ['Spice', 5], ['Smoke', 2], ['Fruit', 6], ['Heat', 4]].map(([k, v]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 22px', gap: 12, alignItems: 'center' }}>
              {sLabel({ children: k, style: { fontSize: 9 } })}
              <div style={{ height: 3, background: SUND.line, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: 3, width: `${v*10}%`, background: accent }} />
                {[...Array(10)].map((_, i) => (
                  <div key={i} style={{ position: 'absolute', left: `${i*10}%`, top: -3, width: 1, height: 8, background: SUND.line }} />
                ))}
              </div>
              <div style={{ fontFamily: sFont.mono, fontSize: 10, color: SUND.ink2, textAlign: 'right' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '22px 24px 0' }}>
          {sLabel({ children: '◆ Tasting Notes', accent: SUND.ink, style: { fontSize: 10 } })}
          <div style={{ fontFamily: sFont.body, fontSize: 15, lineHeight: 1.55, marginTop: 10, color: SUND.ink2 }}>
            <div><span style={{ fontFamily: sFont.mono, fontSize: 9, letterSpacing: '0.18em', color: accent, textTransform: 'uppercase', marginRight: 8, fontWeight: 600 }}>Nose</span>Toasted brown sugar, clove, leather.</div>
            <div style={{ marginTop: 8 }}><span style={{ fontFamily: sFont.mono, fontSize: 9, letterSpacing: '0.18em', color: accent, textTransform: 'uppercase', marginRight: 8, fontWeight: 600 }}>Palate</span>Dark honey, orchard fruit, creamy oak.</div>
            <div style={{ marginTop: 8 }}><span style={{ fontFamily: sFont.mono, fontSize: 9, letterSpacing: '0.18em', color: accent, textTransform: 'uppercase', marginRight: 8, fontWeight: 600 }}>Finish</span>Long, quiet, warming. Dusted with vanilla.</div>
          </div>
        </div>
      </div>
      <STabBar active="catalog" />
    </div>
  );
}

// ─── PROFILE — refreshed ───
function SProfile({ tweaks }) {
  const accent = tweaks.accentB;

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
    <div style={{ height: '100%', background: SUND.bg, color: SUND.ink, position: 'relative' }}>
      <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110 }}>
        {/* Masthead */}
        <div style={{ padding: '6px 24px 18px', position: 'relative', borderBottom: `1.5px solid ${SUND.ink}`, margin: '0 20px' }}>
          <div style={{ position: 'absolute', top: 10, right: 20 }}>
            <SCompass size={56} color={accent} op={0.9} />
          </div>
          {sLabel({ children: '◆ Member Persona', accent: SUND.ink })}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 12 }}>
            <div style={{ width: 64, height: 64, border: `1.5px solid ${SUND.ink}`, background: `color-mix(in srgb, ${accent} 15%, #FAF4E4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sFont.display, fontWeight: 700, fontSize: 32, color: accent, flexShrink: 0 }}>
              Z
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 28, lineHeight: 1.02 }}>
                Zachary Brenner
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                <div style={{ border: `1.5px solid ${accent}`, background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent, padding: '4px 9px', fontFamily: sFont.mono, fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                  ✦ Bourbon
                </div>
                <div style={{ border: `1px solid ${SUND.line}`, color: SUND.ink2, padding: '4px 9px', fontFamily: sFont.mono, fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Since Jun 2023
                </div>
                <div style={{ border: `1px solid ${SUND.line}`, color: SUND.ink2, padding: '4px 9px', fontFamily: sFont.mono, fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                  ◉ Public
                </div>
              </div>
            </div>
          </div>
          <div style={{ fontFamily: sFont.body, fontSize: 14.5, color: SUND.ink2, marginTop: 12, lineHeight: 1.45 }}>
            Bourbon romantic. Rye apologist. Chasing honeyed wheat and long finishes.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
            <Flourish color={SUND.ink} size={120} />
          </div>
        </div>

        {/* Persona pillars */}
        <div style={{ padding: '16px 24px 0', display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          {pillars.map(([t, v, n], i) => (
            <div key={t} style={{ border: `1px solid ${SUND.line}`, background: '#FAF4E4', padding: '12px 14px', display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, border: `1.5px solid ${accent}`, background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sFont.mono, fontSize: 10, fontWeight: 600 }}>
                0{i+1}
              </div>
              <div>
                {sLabel({ children: t, style: { fontSize: 8, color: SUND.ink3 } })}
                <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 17, lineHeight: 1.15, marginTop: 4 }}>{v}</div>
                <div style={{ fontFamily: sFont.body, fontSize: 13, color: SUND.ink3, marginTop: 3, lineHeight: 1.35 }}>{n}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Collector Signal */}
        <div style={{ margin: '20px 24px 24px', border: `1.5px solid ${SUND.ink}`, background: '#FAF4E4', padding: '16px 16px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              {sLabel({ children: '◆ Identity Layer', accent, style: { fontSize: 8.5 } })}
              <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 18, marginTop: 2 }}>Collector Signal</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.4"><path d="M7 21h10l-1-5H8zM12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/></svg>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['124', 'Tasted', '✓'], ['48', 'Wishlist', '✦'], ['312', 'Followers', '◉'], ['4.1', 'Avg score', '★']].map(([v, l, g]) => (
              <div key={l} style={{ border: `1px solid ${SUND.line}`, padding: '10px 12px', background: SUND.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {sLabel({ children: l, style: { fontSize: 8, color: SUND.ink3 } })}
                  <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 20, marginTop: 2 }}>{v}</div>
                </div>
                <div style={{ fontFamily: sFont.mono, fontSize: 14, color: accent, fontWeight: 600 }}>{g}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${SUND.line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              {sLabel({ children: 'Proof tolerance', style: { fontSize: 8, color: SUND.ink3 } })}
              {sLabel({ children: '102° avg', style: { fontSize: 8, color: accent } })}
            </div>
            <div style={{ marginTop: 8, height: 5, background: SUND.line, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: 5, width: '52%', background: accent }} />
              {[0, 0.33, 0.66, 1].map((t, i) => (
                <div key={i} style={{ position: 'absolute', left: `calc(${t*100}% - 0.5px)`, top: -3, width: 1, height: 11, background: SUND.ink }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: sFont.mono, fontSize: 8, color: SUND.ink3, letterSpacing: '0.14em' }}>
              <span>80</span><span>100</span><span>120</span><span>140+</span>
            </div>
          </div>
        </div>

        {/* Top Shelf */}
        <div style={{ padding: '0 24px 8px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
          {sLabel({ children: '◆  TOP SHELF  ◆', accent: SUND.ink, style: { fontSize: 10 } })}
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
        </div>
        <div style={{ padding: '14px 24px 24px' }}>
          <div style={{ border: `1.5px solid ${accent}`, background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 10%, #FAF4E4), #FAF4E4)`, padding: '18px 16px', position: 'relative', overflow: 'hidden', marginBottom: 8, display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, alignItems: 'center' }}>
            <div style={{ position: 'absolute', right: 10, top: 4, fontFamily: sFont.display, fontWeight: 700, fontSize: 56, color: accent, opacity: 0.12, lineHeight: 1 }}>01</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SBottle h={110} accent={accent} shade="amber" />
            </div>
            <div>
              <div style={{ display: 'inline-block', border: `1.5px solid ${accent}`, background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, padding: '3px 8px', fontFamily: sFont.mono, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                Crown Bottle
              </div>
              <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 20, lineHeight: 1.1 }}>Elkhorn Creek SB</div>
              {sLabel({ children: 'Bourbon · Kentucky · 94 PR', style: { fontSize: 8.5, color: SUND.ink3, marginTop: 4 } })}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <div style={{ border: `1px solid ${SUND.line}`, padding: '4px 8px', fontFamily: sFont.mono, fontSize: 9, color: SUND.ink2, fontWeight: 600 }}>94°</div>
                <div style={{ border: `1.5px solid ${accent}`, padding: '4px 8px', fontFamily: sFont.mono, fontSize: 9, color: accent, fontWeight: 600 }}>$89</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['Stagg Jr.', 'dark', '02', '130 PR'], ['Redbreast 12', 'light', '03', '80 PR']].map(([n, shade, no, pr]) => (
              <div key={n} style={{ border: `1px solid ${SUND.line}`, background: '#FAF4E4', padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, right: 8, fontFamily: sFont.mono, fontSize: 9, color: SUND.ink3, fontWeight: 600 }}>{no}</div>
                <SBottle h={70} accent={accent} shade={shade} />
                <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 14, textAlign: 'center', lineHeight: 1.1 }}>{n}</div>
                <div style={{ fontFamily: sFont.mono, fontSize: 8, color: SUND.ink3, letterSpacing: '0.14em', fontWeight: 600 }}>{pr}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Flavor DNA */}
        <div style={{ padding: '0 24px 8px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
          {sLabel({ children: '◆  FLAVOR DNA  ◆', accent: SUND.ink, style: { fontSize: 10 } })}
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
        </div>
        <div style={{ padding: '14px 24px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 20, lineHeight: 1.1 }}>A mapped palate signature</div>
            <div style={{ fontFamily: sFont.mono, fontSize: 9, color: SUND.ink3, marginTop: 6, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
              Built from 124 tasted bottles
            </div>
          </div>
          <div style={{ background: '#FAF4E4', border: `1.5px solid ${SUND.ink}`, padding: '14px 10px', display: 'flex', justifyContent: 'center' }}>
            <SFlavorRadar data={flavorDNA} accent={accent} ink={SUND.ink} line={SUND.lineStrong} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {leadingNotes.map((n, i) => (
              <div key={n.k} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 10, alignItems: 'center', padding: '8px 12px', border: `1px solid ${SUND.line}`, background: '#FAF4E4' }}>
                <div style={{ fontFamily: sFont.mono, fontSize: 9, color: SUND.ink3, fontWeight: 600 }}>#{i+1}</div>
                <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 15 }}>{n.k.charAt(0) + n.k.slice(1).toLowerCase()}</div>
                <div style={{ width: 60, height: 3, background: SUND.line, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: 3, width: `${n.v*10}%`, background: accent }} />
                </div>
                <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 15, color: accent }}>{n.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Journal */}
        <div style={{ padding: '24px 24px 8px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
          {sLabel({ children: '◆  JOURNAL  ◆', accent: SUND.ink, style: { fontSize: 10 } })}
          <div style={{ flex: 1, height: 1, background: SUND.ink }} />
        </div>
        <div style={{ padding: '14px 24px 24px' }}>
          {/* Featured */}
          <div style={{ border: `1.5px solid ${accent}`, background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 8%, #FAF4E4), #FAF4E4)`, padding: '16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 20, lineHeight: 1.1 }}>Elkhorn Creek SB</div>
                {sLabel({ children: 'Buffalo Trace · 94 PR · Bourbon', style: { fontSize: 8, color: SUND.ink3, marginTop: 4 } })}
              </div>
              <div style={{ border: `1.5px solid ${accent}`, background: `color-mix(in srgb, ${accent} 10%, transparent)`, padding: '4px 8px', display: 'flex', gap: 2, color: accent, flexShrink: 0 }}>
                {[1,1,1,1,0].map((f,i) => <SStar key={i} filled={!!f} size={9}/>)}
              </div>
            </div>
            <div style={{ fontFamily: sFont.body, fontSize: 14.5, color: SUND.ink2, lineHeight: 1.45, marginTop: 10 }}>
              Poured neat, it opens with clove and dark honey. A second glass reveals stone fruit, leather, and that
              long, quiet finish I keep chasing. This is the one.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              {sLabel({ children: '2 days ago', style: { fontSize: 8, color: SUND.ink3 } })}
              <div style={{ border: `1.5px solid ${accent}`, background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent, padding: '3px 8px', fontFamily: sFont.mono, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                Featured opinion
              </div>
            </div>
          </div>
          {[
            ['Redbreast 12', 'Jameson · 80 PR · Irish', 4, '5 days ago', 'Rounded, honeyed, clean. A safe keep.'],
            ['Hibiki Harmony', 'Suntory · 86 PR · Japanese', 4, '1 week ago', 'Floral top, soft oak, nimble finish.'],
          ].map(([n, meta, r, ago, text], i) => (
            <div key={i} style={{ border: `1px solid ${SUND.line}`, background: '#FAF4E4', padding: '14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: sFont.display, fontWeight: 700, fontSize: 17, lineHeight: 1.1 }}>{n}</div>
                  {sLabel({ children: meta, style: { fontSize: 8, color: SUND.ink3, marginTop: 4 } })}
                </div>
                <div style={{ display: 'flex', gap: 2, color: accent }}>
                  {[1,1,1,1,0].map((f,j) => <SStar key={j} filled={j < r} size={9}/>)}
                </div>
              </div>
              <div style={{ fontFamily: sFont.body, fontSize: 13.5, color: SUND.ink2, lineHeight: 1.4, marginTop: 8 }}>
                {text}
              </div>
              {sLabel({ children: ago, style: { fontSize: 8, color: SUND.ink3, marginTop: 10 } })}
            </div>
          ))}
        </div>
      </div>
      <STabBar active="profile" />
    </div>
  );
}

window.SundownScreens = {
  onboarding: SOnboarding,
  home: SHome,
  catalog: SCatalog,
  detail: SDetail,
  profile: SProfile,
};
