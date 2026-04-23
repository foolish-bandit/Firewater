// Catalog.jsx — filter + grid/list browse
const { useState: useCState } = React;

function Catalog({ onNav }) {
  const [view, setView] = useCState('grid');
  const [category, setCategory] = useCState('All');
  const cats = ['All', 'Bourbon', 'Rye', 'Scotch', 'Agave', 'Rum', 'Gin'];

  const bottles = [
    ['Widow\'s Watch', 'Rye', '12yr', 107, 184, 4.6],
    ['Brass Cartridge', 'Bourbon', '8yr', 95, 68, 4.3],
    ['Ghost Ranch', 'Añejo', '5yr', 80, 112, 4.7],
    ['Pale Lantern', 'Scotch', '18yr', 86, 240, 4.5],
    ['Stonewall', 'Bourbon', '10yr', 100, 88, 4.2],
    ['Black Creek', 'Rye', '6yr', 92, 52, 3.9],
    ['Cinder & Salt', 'Mezcal', 'Joven', 90, 94, 4.4],
    ['Four Winds', 'Bourbon', '15yr', 110, 210, 4.8],
    ['Highland Rift', 'Scotch', '12yr', 86, 78, 4.1],
    ['Burnt Offering', 'Rye', 'Cask', 114, 165, 4.5],
    ['Sunset Trail', 'Blanco', 'NAS', 80, 64, 4.0],
    ['Iron Maple', 'Bourbon', '7yr', 100, 72, 4.2],
  ];

  return (
    <div>
      {/* Title block */}
      <section className="wrap" style={{ padding: '72px 48px 48px', textAlign: 'center' }}>
        <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;THE CELLAR &nbsp;·&nbsp; 2,184 entries</div>
        <h1 className="display italic" style={{ fontSize: 104, margin: '16px 0', lineHeight: 1 }}>The Catalog</h1>
        <Flourish width={200} />
        <p className="lede" style={{ maxWidth: 640, margin: '22px auto 0' }}>
          Every bottle we've logged, tasted, and taken honest notes on. Filter by vein, age, or price.
        </p>
      </section>

      {/* Filter bar */}
      <section style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'var(--surf)', position: 'sticky', top: 72, zIndex: 40 }}>
        <div className="wrap" style={{ padding: '18px 48px', display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {cats.map(c => (
              <button key={c} className={'chip' + (category === c ? ' on' : '')} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={'chip' + (view === 'grid' ? ' on' : '')} onClick={() => setView('grid')}>Grid</button>
            <button className={'chip' + (view === 'list' ? ' on' : '')} onClick={() => setView('list')}>List</button>
          </div>
        </div>
      </section>

      <div className="wrap" style={{ padding: '48px 48px 0', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 48 }}>
        {/* Sidebar filters */}
        <aside style={{ borderRight: '1px solid var(--line)', paddingRight: 32 }}>
          <FilterGroup title="Price" items={['Under $50', '$50–$100', '$100–$200', '$200+']} />
          <FilterGroup title="Age" items={['NAS', '4–8 yr', '9–15 yr', '16+ yr']} />
          <FilterGroup title="Proof" items={['80–90', '90–100', '100–110', '110+']} />
          <FilterGroup title="Region" items={['Kentucky', 'Tennessee', 'Scotland', 'Ireland', 'Mexico', 'Japan']} />
          <FilterGroup title="Rating" items={['◆◆◆◆◆ 4.5+', '◆◆◆◆◇ 4.0+', '◆◆◆◇◇ 3.0+']} />
        </aside>

        {/* Results */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
            <span className="kicker">Showing {bottles.length} of 2,184 · {category}</span>
            <span className="kicker">Sort: Highest Rated ▾</span>
          </div>

          {view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
              {bottles.map(([name, type, age, proof, price, rating]) => (
                <div key={name} onClick={() => onNav('detail')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0', background: 'var(--surf)', border: '1px solid var(--line)' }}>
                    <Bottle h={260} name={name.toUpperCase()} sub={type} year="2019" />
                  </div>
                  <div className="kicker" style={{ marginTop: 14 }}>{type} · {age} · {proof}°</div>
                  <div className="display italic" style={{ fontSize: 24, marginTop: 6 }}>{name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <Rating value={rating} />
                    <span className="display" style={{ fontSize: 20, color: 'var(--accent)' }}>${price}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--line)' }}>
              {bottles.map(([name, type, age, proof, price, rating]) => (
                <div key={name} onClick={() => onNav('detail')}
                     style={{ display: 'grid', gridTemplateColumns: '60px 2fr 1fr 1fr 1fr 80px', gap: 20, alignItems: 'center', padding: '18px 0', borderBottom: '1px dashed var(--line)', cursor: 'pointer' }}>
                  <div style={{ width: 50, height: 72, background: 'linear-gradient(180deg, #2A211A, #1a1512)', border: '1px solid var(--line)' }} />
                  <div>
                    <div className="display italic" style={{ fontSize: 22 }}>{name}</div>
                    <div className="kicker" style={{ marginTop: 4 }}>{type} · {age}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{proof}° proof</span>
                  <Rating value={rating} />
                  <span className="kicker">Kentucky</span>
                  <span className="display" style={{ fontSize: 22, color: 'var(--accent)', textAlign: 'right' }}>${price}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}

function FilterGroup({ title, items }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div className="kicker accent" style={{ color: 'var(--accent)', marginBottom: 12 }}>◆ {title}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(i => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--ink-2)', fontSize: 15, fontFamily: 'var(--font-body)' }}>
            <span style={{ width: 12, height: 12, border: '1px solid var(--line-strong)', display: 'inline-block' }} />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

window.Catalog = Catalog;
