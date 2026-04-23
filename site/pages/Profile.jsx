// Profile.jsx — public collector page
function Profile({ onNav }) {
  return (
    <div>
      {/* Header */}
      <section style={{ background: 'var(--surf)', borderBottom: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -80, top: -40, color: 'var(--accent)', opacity: 0.08 }}>
          <Compass size={420} opacity={1} />
        </div>
        <div className="wrap" style={{ padding: '72px 48px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 40, alignItems: 'center' }}>
          <div style={{ width: 160, height: 160, border: '2px solid var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surf-alt)' }}>
            <span className="display" style={{ fontSize: 72, color: 'var(--accent)' }}>JC</span>
          </div>
          <div>
            <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;COLLECTOR &nbsp;·&nbsp; MEMBER SINCE 2024</div>
            <h1 className="display italic" style={{ fontSize: 72, margin: '14px 0 8px', lineHeight: 1 }}>Jack Carr</h1>
            <div className="kicker">Marfa, Texas &nbsp;·&nbsp; @jcarr</div>
            <p className="lede" style={{ marginTop: 16, maxWidth: 560 }}>
              Rye supremacist. Believes a bottle is a story you can pour. Keeps honest notes because memory lies.
            </p>
          </div>
          <button className="btn btn-ghost">+ Follow</button>
        </div>

        {/* Stat strip */}
        <div style={{ borderTop: '1px solid var(--line)' }}>
          <div className="wrap" style={{ padding: '24px 48px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
            {[['342', 'On the shelf'], ['1,204', 'Pours logged'], ['87', 'Reviews'], ['412', 'Followers'], ['↗ Rye', 'Signature']].map(([n, l], i) => (
              <div key={i} style={{ textAlign: 'center', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
                <div className="display" style={{ fontSize: 38, color: 'var(--accent)' }}>{n}</div>
                <div className="kicker" style={{ marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOP SHELF — featured bottle + top 5 */}
      <section className="wrap" style={{ padding: '80px 48px', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 64, alignItems: 'center' }}>
        <div>
          <Rule title="Top Shelf" align="left" />
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <Bottle h={420} name="WIDOW'S WATCH" sub="Ceremonial" year="2016" />
          </div>
          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <div className="display italic" style={{ fontSize: 28 }}>Widow's Watch</div>
            <Rating value={4.8} />
            <div className="kicker" style={{ marginTop: 6 }}>"The one I reach for."</div>
          </div>
        </div>

        <div>
          <Rule title="Top 5 Pours of the Year" align="left" />
          <div style={{ marginTop: 24 }}>
            {[
              ['01', "Widow's Watch", 'Rye · 12yr', 4.8],
              ['02', 'Four Winds', 'Bourbon · 15yr', 4.7],
              ['03', 'Ghost Ranch', 'Añejo · 5yr', 4.6],
              ['04', 'Burnt Offering', 'Rye · Cask', 4.5],
              ['05', 'Pale Lantern', 'Scotch · 18yr', 4.4],
            ].map(([rank, name, sub, rating]) => (
              <div key={rank} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 24, alignItems: 'center', padding: '18px 0', borderBottom: '1px solid var(--line)' }}>
                <span className="display" style={{ fontSize: 40, color: 'var(--accent)', opacity: 0.5 }}>{rank}</span>
                <div>
                  <div className="display italic" style={{ fontSize: 24 }}>{name}</div>
                  <div className="kicker" style={{ marginTop: 3 }}>{sub}</div>
                </div>
                <Rating value={rating} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flavor DNA + recent log */}
      <section style={{ background: 'var(--surf)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap" style={{ padding: '80px 48px', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 64 }}>
          <div>
            <Rule title="Flavor DNA" align="left" />
            <p className="lede" style={{ marginTop: 16, maxWidth: 420, fontSize: 18 }}>
              What Jack's palate actually likes — learned from 1,204 pours, not guessed.
            </p>
            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Oak & Spice', 0.86], ['Leather', 0.72], ['Fruit', 0.58], ['Smoke', 0.44], ['Sweet', 0.28], ['Floral', 0.12]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="kicker">{k}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{Math.round(v * 100)}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--line-strong)' }}>
                    <div style={{ height: '100%', width: `${v * 100}%`, background: 'var(--accent)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Rule title="The Log · Recent" align="left" trailing="View all" />
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column' }}>
              {[
                ['LOGGED', "Widow's Watch", 'Porch at sunset. 4 fingers neat.', '2d ago'],
                ['REVIEWED', 'Burnt Offering', 'Cask strength rye. Rounder than expected.', '5d ago'],
                ['ADDED', 'Iron Maple', 'Shelf rotation for the fall.', '1w ago'],
                ['POURED', 'Ghost Ranch', 'Split with friends over a campfire.', '2w ago'],
              ].map(([action, name, note, time], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 100px', gap: 18, padding: '20px 0', borderBottom: '1px solid var(--line)', alignItems: 'start' }}>
                  <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>◆</span>
                  <div>
                    <div className="kicker">{action}</div>
                    <div className="display italic" style={{ fontSize: 22, marginTop: 4 }}>{name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 4 }}>"{note}"</div>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

window.Profile = Profile;
