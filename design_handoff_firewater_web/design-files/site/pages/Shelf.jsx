// Shelf.jsx — "My Firewater" — the logged-in self view
const { useState: useShState } = React;

function Shelf({ onNav }) {
  const [tab, setTab] = useShState('shelf');
  const [showAdd, setShowAdd] = useShState(false);

  return (
    <div>
      {/* Header — feels personal, less marketing */}
      <section style={{ background: 'var(--surf)', borderBottom: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -100, top: -60, opacity: 0.06 }}>
          <Compass size={480} opacity={1} />
        </div>
        <div className="wrap" style={{ position: 'relative', padding: '48px 48px 0', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 32, alignItems: 'center' }}>
          <div style={{ width: 96, height: 96, border: '2px solid var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surf-alt)' }}>
            <span className="display" style={{ fontSize: 44, color: 'var(--accent)' }}>JC</span>
          </div>
          <div>
            <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;YOUR ALMANAC</div>
            <h1 className="display italic" style={{ fontSize: 68, lineHeight: 1, margin: '8px 0 4px' }}>
              Evening, <span style={{ color: 'var(--accent)' }}>Jack</span>.
            </h1>
            <div className="kicker">342 on the shelf · 1,204 pours logged · 87 reviews</div>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <span style={{ fontSize: 18 }}>+</span> Log a Pour
          </button>
        </div>

        {/* Tabs */}
        <div className="wrap" style={{ padding: '40px 48px 0' }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)' }}>
            {[
              ['shelf', 'The Shelf', '342'],
              ['log', 'The Log', '1,204'],
              ['wishlist', 'Wishlist', '28'],
              ['friends', 'Friends', '87'],
              ['stats', 'Stats', ''],
            ].map(([k, l, c]) => (
              <button key={k} onClick={() => setTab(k)}
                      style={{
                        padding: '16px 22px', border: 0, background: 'transparent',
                        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
                        cursor: 'pointer', color: tab === k ? 'var(--accent)' : 'var(--ink-2)',
                        borderBottom: tab === k ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: -1, display: 'flex', alignItems: 'baseline', gap: 8,
                      }}>
                {l} {c && <span style={{ color: 'var(--ink-3)', fontSize: 10 }}>{c}</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap" style={{ padding: '48px 48px 80px' }}>
        {tab === 'shelf' && <ShelfGrid onNav={onNav} />}
        {tab === 'log' && <PourLog />}
        {tab === 'wishlist' && <Wishlist />}
        {tab === 'friends' && <Friends />}
        {tab === 'stats' && <Stats />}
      </section>

      {showAdd && <AddPour onClose={() => setShowAdd(false)} />}

      <Footer />
    </div>
  );
}

// ---------- SHELF GRID ----------
function ShelfGrid({ onNav }) {
  const bottles = [
    { name: "Widow's Watch", sub: 'Rye · 12yr', year: 2016, rating: 4.8, status: 'open' },
    { name: 'Four Winds', sub: 'Bourbon · 15yr', year: 2014, rating: 4.7, status: 'sealed' },
    { name: 'Ghost Ranch', sub: 'Añejo · 5yr', year: 2020, rating: 4.6, status: 'open' },
    { name: 'Burnt Offering', sub: 'Rye · Cask', year: 2018, rating: 4.5, status: 'low' },
    { name: 'Pale Lantern', sub: 'Scotch · 18yr', year: 2007, rating: 4.4, status: 'sealed' },
    { name: 'Iron Maple', sub: 'Bourbon · 8yr', year: 2017, rating: 4.3, status: 'open' },
    { name: 'Dust & Ember', sub: 'Rye · 10yr', year: 2015, rating: 4.2, status: 'empty' },
    { name: 'Canyon Proof', sub: 'Bourbon · 12yr', year: 2013, rating: 4.1, status: 'open' },
    { name: 'Redwing', sub: 'Rye · Single', year: 2019, rating: 4.0, status: 'sealed' },
    { name: 'Owl\'s Eye', sub: 'Bourbon · 10yr', year: 2016, rating: 3.9, status: 'low' },
    { name: 'Saltlick', sub: 'Rye · Barrel', year: 2021, rating: 3.8, status: 'open' },
    { name: 'Grey Vespers', sub: 'Scotch · 12yr', year: 2014, rating: 3.7, status: 'sealed' },
  ];
  const STATUS = {
    open: { label: 'OPEN', color: 'var(--accent)' },
    sealed: { label: 'SEALED', color: 'var(--ink-2)' },
    low: { label: 'LOW', color: '#c87a4d' },
    empty: { label: 'EMPTY', color: 'var(--ink-3)' },
  };
  return (
    <div>
      {/* Filter strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 32, flexWrap: 'wrap' }}>
        <span className="kicker">Showing</span>
        {['All', 'Open', 'Rye', 'Bourbon', 'Agave'].map((f, i) => (
          <button key={f} style={{
            background: i === 0 ? 'var(--accent)' : 'transparent',
            color: i === 0 ? 'var(--bg)' : 'var(--ink-2)',
            border: '1px solid ' + (i === 0 ? 'var(--accent)' : 'var(--line-strong)'),
            padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
          }}>{f}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span className="kicker" style={{ color: 'var(--ink-3)' }}>Sort:</span>
        <span className="kicker accent" style={{ color: 'var(--accent)' }}>Recently Poured ↓</span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid var(--line)', borderLeft: '1px solid var(--line)' }}>
        {bottles.map((b, i) => (
          <div key={i} onClick={() => onNav('detail')} style={{
            borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
            padding: '28px 20px 24px', cursor: 'pointer', position: 'relative',
            transition: 'background 0.2s', background: 'var(--bg)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surf)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
            {/* Status ribbon */}
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, background: STATUS[b.status].color, display: 'inline-block' }} />
              <span className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: STATUS[b.status].color }}>{STATUS[b.status].label}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <Bottle h={200} name={b.name.toUpperCase()} sub={b.sub.split(' · ')[0]} year={b.year} />
            </div>
            <div style={{ marginTop: 18 }}>
              <div className="display italic" style={{ fontSize: 22, lineHeight: 1.1 }}>{b.name}</div>
              <div className="kicker" style={{ marginTop: 4 }}>{b.sub}</div>
              <div style={{ marginTop: 8 }}><Rating value={b.rating} /></div>
            </div>
          </div>
        ))}

        {/* Add bottle card */}
        <div style={{
          borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
          padding: '28px 20px', cursor: 'pointer', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 360, background: 'var(--surf)',
        }}>
          <div style={{ fontSize: 48, color: 'var(--accent)', marginBottom: 12 }}>+</div>
          <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ ADD BOTTLE</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-3)', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
            Scan with the app<br/>or search the catalog
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- POUR LOG ----------
function PourLog() {
  const entries = [
    { d: 'Apr 21', time: '9:42 PM', b: "Widow's Watch", note: 'Porch at sunset. 4 fingers neat. Better than I remembered.', rating: 4.8, n: ['oak','leather','orange peel','campfire'] },
    { d: 'Apr 19', time: '6:15 PM', b: 'Burnt Offering', note: 'Cask strength rye. Rounder than expected. Cuts with a drop.', rating: 4.5, n: ['black pepper','dark cherry','cedar'] },
    { d: 'Apr 17', time: '11:28 PM', b: 'Ghost Ranch', note: 'Split with Nieves over a campfire. Right drink, right moment.', rating: 4.6, n: ['caramel','vanilla','woodsmoke'] },
    { d: 'Apr 14', time: '10:03 PM', b: 'Pale Lantern', note: 'Quiet dram. Let it breathe a while.', rating: 4.4, n: ['honey','orchard fruit','peat'] },
    { d: 'Apr 11', time: '8:47 PM', b: 'Iron Maple', note: 'Weeknight dram. Dependable.', rating: 4.2, n: ['maple','clove','toffee'] },
  ];
  // Group by month (single here but shows structure)
  return (
    <div style={{ maxWidth: 900 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--line)', marginBottom: 48 }}>
        {[['5', 'This week'], ['23', 'This month'], ['4.5', 'Avg rating'], ['Widow\'s', 'Most poured']].map(([n, l], i) => (
          <div key={i} style={{ padding: '24px 20px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
            <div className="display italic" style={{ fontSize: 32, color: 'var(--accent)' }}>{n}</div>
            <div className="kicker" style={{ marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28 }}>
        <h3 className="display italic" style={{ fontSize: 40, margin: 0 }}>April 2026</h3>
        <Flourish width={120} />
      </div>

      <div>
        {entries.map((e, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 32, padding: '28px 0', borderTop: '1px solid var(--line)' }}>
            <div>
              <div className="display italic" style={{ fontSize: 26, color: 'var(--accent)' }}>{e.d}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{e.time}</div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <div className="display italic" style={{ fontSize: 26 }}>{e.b}</div>
                  <div style={{ marginTop: 4 }}><Rating value={e.rating} /></div>
                </div>
                <button className="kicker" style={{ background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-2)', padding: '6px 10px', cursor: 'pointer' }}>EDIT</button>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 12, lineHeight: 1.5 }}>"{e.note}"</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {e.n.map(t => (
                  <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid var(--line-strong)', color: 'var(--ink-2)' }}>◆ {t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- WISHLIST ----------
function Wishlist() {
  const items = [
    ['Antelope', 'Bourbon · 20yr', '$340', 'Spotted at Justin\'s bar'],
    ['Slow Creek Reserve', 'Rye · Cask', '$280', 'Awaiting 2026 release'],
    ['Holloway Small Batch', 'Bourbon · 12yr', '$180', 'Next time in Louisville'],
    ['Dust Devil', 'Añejo · 8yr', '$140', 'Distillery only'],
    ['The Reckoner', 'Rye · 15yr', '$420', 'Birthday gift to self, maybe'],
  ];
  return (
    <div style={{ maxWidth: 860 }}>
      <p className="lede" style={{ fontSize: 18, color: 'var(--ink-2)', marginBottom: 32 }}>
        Bottles on the hunt. Five you're keeping an eye on — we'll tell you when they land near Marfa.
      </p>
      {items.map(([n, sub, price, note], i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 24, alignItems: 'center', padding: '22px 0', borderTop: '1px solid var(--line)', borderBottom: i === items.length - 1 ? '1px solid var(--line)' : 'none' }}>
          <div style={{ width: 40, height: 40, border: '1px solid var(--accent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>◆</div>
          <div>
            <div className="display italic" style={{ fontSize: 26 }}>{n}</div>
            <div className="kicker" style={{ marginTop: 4 }}>{sub} &nbsp;·&nbsp; <span style={{ color: 'var(--ink-3)', textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>{note}</span></div>
          </div>
          <div className="display" style={{ fontSize: 22, color: 'var(--accent)' }}>{price}</div>
          <button className="btn btn-ghost" style={{ padding: '8px 14px' }}>Track</button>
        </div>
      ))}
    </div>
  );
}

// ---------- FRIENDS ACTIVITY ----------
function Friends() {
  const feed = [
    { who: 'A. Nieves', what: 'logged a pour of', bottle: 'Four Winds', note: 'Ice night. Surprised me.', time: '1h', rating: 4.7 },
    { who: 'M. Ortega', what: 'added to shelf', bottle: 'The Reckoner', note: null, time: '4h' },
    { who: 'R. Holloway', what: 'reviewed', bottle: 'Burnt Offering', note: 'The rye that restored my faith in ryes.', time: '1d', rating: 4.9 },
    { who: 'K. Tate', what: 'started following you', bottle: null, time: '2d' },
    { who: 'A. Nieves', what: 'added to wishlist', bottle: 'Antelope', note: null, time: '3d' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 64 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
          <h3 className="display italic" style={{ fontSize: 32, margin: 0 }}>The Feed</h3>
          <Flourish width={100} />
        </div>
        {feed.map((f, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 16, padding: '22px 0', borderTop: '1px solid var(--line)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--accent)', background: 'var(--surf-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18 }}>
              {f.who.split(' ').map(w => w[0]).join('')}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 17 }}>
                <b style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 20 }}>{f.who}</b>
                <span style={{ color: 'var(--ink-2)' }}> {f.what} </span>
                {f.bottle && <b style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 20 }}>{f.bottle}</b>}
              </div>
              {f.note && <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 8 }}>"{f.note}"</p>}
              {f.rating && <div style={{ marginTop: 6 }}><Rating value={f.rating} /></div>}
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{f.time}</span>
          </div>
        ))}
      </div>

      <aside>
        <Rule title="Suggested" align="left" />
        <div style={{ marginTop: 24 }}>
          {[
            ['J. Pérez', 'Austin · 214 bottles', 'Follows 3 you follow'],
            ['S. Yamamoto', 'Portland · 89 bottles', 'Also loves Widow\'s Watch'],
            ['D. Orozco', 'Nashville · 502 bottles', 'Rye collector'],
          ].map(([n, meta, why], i) => (
            <div key={i} style={{ padding: '16px 0', borderTop: '1px solid var(--line)' }}>
              <div className="display italic" style={{ fontSize: 22 }}>{n}</div>
              <div className="kicker" style={{ marginTop: 3 }}>{meta}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', marginTop: 6 }}>{why}</div>
              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 10, marginTop: 10 }}>+ Follow</button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

// ---------- STATS ----------
function Stats() {
  const byMonth = [12, 18, 24, 31, 28, 19, 22, 35, 41, 38, 29, 23];
  const max = Math.max(...byMonth);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div>
      {/* Headline stat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, marginBottom: 64 }}>
        <div>
          <Rule title="The Year So Far" align="left" />
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div className="display italic" style={{ fontSize: 140, lineHeight: 0.9, color: 'var(--accent)' }}>320</div>
            <div>
              <div className="display italic" style={{ fontSize: 32 }}>pours</div>
              <div className="kicker">Across 94 bottles</div>
            </div>
          </div>
          <p className="lede" style={{ marginTop: 20, fontSize: 18, maxWidth: 460 }}>
            That's roughly every <b style={{ color: 'var(--accent)' }}>1.1 days</b>. Your average pour: 1.7oz. Favorite hour: 9&ndash;10pm.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Compass size={280} opacity={0.25} />
        </div>
      </div>

      {/* Chart */}
      <div style={{ border: '1px solid var(--line)', padding: 40, marginBottom: 48 }}>
        <Rule title="Pours by Month" align="left" />
        <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8, alignItems: 'end', height: 240 }}>
          {byMonth.map((v, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{
                  width: '70%', height: `${(v / max) * 100}%`,
                  background: i === 3 ? 'var(--accent)' : 'var(--line-strong)',
                  position: 'relative',
                }}>
                  {i === 3 && <span className="mono" style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: 'var(--accent)' }}>{v}</span>}
                </div>
              </div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown grids */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div>
          <Rule title="By Category" align="left" />
          <div style={{ marginTop: 24 }}>
            {[['Rye', 42, 134], ['Bourbon', 31, 99], ['Agave', 14, 45], ['Scotch', 8, 26], ['Other', 5, 16]].map(([k, pct, n]) => (
              <div key={k} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="display italic" style={{ fontSize: 20 }}>{k}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{n} pours · {pct}%</span>
                </div>
                <div style={{ height: 3, background: 'var(--line)' }}>
                  <div style={{ height: '100%', width: pct + '%', background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Rule title="Top Flavors" align="left" />
          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['oak', 92], ['leather', 78], ['caramel', 64], ['vanilla', 58],
              ['orange peel', 44], ['black pepper', 42], ['cherry', 38], ['honey', 34],
              ['smoke', 29], ['cedar', 24], ['clove', 18], ['maple', 15],
            ].map(([k, n]) => (
              <span key={k} style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                padding: `${Math.max(4, n/8)}px ${Math.max(8, n/6)}px`,
                border: '1px solid var(--line-strong)',
                color: n > 60 ? 'var(--accent)' : 'var(--ink-2)',
                borderColor: n > 60 ? 'var(--accent)' : 'var(--line-strong)',
              }}>◆ {k} <span style={{ color: 'var(--ink-3)', marginLeft: 4 }}>{n}</span></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- ADD POUR MODAL ----------
function AddPour({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(12,10,9,0.84)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 40, backdropFilter: 'blur(6px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 640, background: 'var(--bg)',
        border: '1px solid var(--line-strong)', padding: '48px 56px',
        position: 'relative',
      }}>
        {/* corner marks */}
        {[['tl', '0', '0'], ['tr', 'auto 0 auto auto'], ['bl', 'auto auto 0 0'], ['br', 'auto 0 0 auto']].map(([k], i) => (
          <span key={k} style={{
            position: 'absolute', width: 14, height: 14,
            borderColor: 'var(--accent)', borderStyle: 'solid',
            top: i < 2 ? 10 : 'auto', bottom: i >= 2 ? 10 : 'auto',
            left: i % 2 === 0 ? 10 : 'auto', right: i % 2 === 1 ? 10 : 'auto',
            borderWidth: `${i < 2 ? '1px' : '0'} ${i % 2 === 1 ? '1px' : '0'} ${i >= 2 ? '1px' : '0'} ${i % 2 === 0 ? '1px' : '0'}`,
          }} />
        ))}

        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'transparent', border: 'none', color: 'var(--ink-3)',
          fontSize: 24, cursor: 'pointer', fontFamily: 'var(--font-display)',
        }}>×</button>

        <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;LOG A POUR</div>
        <h2 className="display italic" style={{ fontSize: 52, margin: '12px 0' }}>What are you drinking?</h2>
        <Flourish width={140} />

        <div style={{ marginTop: 32 }}>
          <label className="kicker" style={{ display: 'block', marginBottom: 8 }}>◆ Bottle</label>
          <input placeholder="Search your shelf or the catalog…" style={{
            width: '100%', padding: '14px 18px',
            border: '1px solid var(--line-strong)', background: 'var(--surf)',
            color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 18,
            marginBottom: 20,
          }} />

          <label className="kicker" style={{ display: 'block', marginBottom: 8 }}>◆ Rating</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} style={{ fontSize: 28, color: n <= 4 ? 'var(--accent)' : 'var(--line-strong)' }}>◆</span>
            ))}
          </div>

          <label className="kicker" style={{ display: 'block', marginBottom: 8 }}>◆ Tasting Notes</label>
          <textarea rows="3" placeholder="Nose, palate, finish. What happened tonight?" style={{
            width: '100%', padding: '14px 18px',
            border: '1px solid var(--line-strong)', background: 'var(--surf)',
            color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 17,
            marginBottom: 20, resize: 'vertical', fontStyle: 'italic',
          }} />

          <label className="kicker" style={{ display: 'block', marginBottom: 8 }}>◆ Flavor Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 32 }}>
            {['oak', 'leather', 'caramel', 'vanilla', 'cherry', 'smoke', 'pepper', 'honey', 'citrus'].map((t, i) => (
              <span key={t} style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                padding: '6px 12px', border: '1px solid ' + (i < 2 ? 'var(--accent)' : 'var(--line-strong)'),
                color: i < 2 ? 'var(--accent)' : 'var(--ink-2)', cursor: 'pointer',
              }}>◆ {t}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary">Pour it in →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Shelf = Shelf;
