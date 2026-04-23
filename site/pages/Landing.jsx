// Landing.jsx — hero + marketing
const { useState: useLState } = React;

function Landing({ onNav }) {
  return (
    <div>
      {/* HERO */}
      <section style={{ position: 'relative', minHeight: 720, overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
        {/* atmospheric backdrop */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 70% 40%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 55%), radial-gradient(ellipse at 10% 90%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 50%)',
        }} />
        {/* compass watermark */}
        <div style={{ position: 'absolute', right: -120, top: 60, opacity: 0.08 }}>
          <Compass size={520} opacity={1} />
        </div>

        <div className="wrap" style={{ position: 'relative', padding: '96px 48px 72px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div className="kicker accent" style={{ color: 'var(--accent)', marginBottom: 24 }}>◆ &nbsp;A Field Guide to American Spirits</div>
            <h1 className="display italic" style={{ fontSize: 108, margin: 0, lineHeight: 0.96 }}>
              Every pour<br/>tells a<br/><span style={{ color: 'var(--accent)' }}>story.</span>
            </h1>
            <Flourish width={220} />
            <p className="lede" style={{ maxWidth: 520, marginTop: 28 }}>
              Firewater is a discovery journal for bourbon, rye, agave and the rest of the good stuff. Find bottles, keep honest notes, and trust the shelf you're building.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 36 }}>
              <button className="btn btn-primary" onClick={() => onNav('download')}>Get the App →</button>
              <button className="btn btn-ghost" onClick={() => onNav('discover')}>Browse the Dispatch</button>
            </div>
            <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
              <Stat n="2,184" label="Bottles catalogued" />
              <Stat n="47k" label="Tasting notes" />
              <Stat n="312" label="Distilleries" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Bottle h={540} name="WILD STALLION" sub="Kentucky Straight" year="2018" />
              <div style={{ position: 'absolute', right: -40, top: 40, width: 200, padding: 18, background: 'var(--surf)', border: '1px solid var(--line-strong)' }}>
                <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ Tonight's Pour</div>
                <div className="display italic" style={{ fontSize: 22, marginTop: 10 }}>Wild Stallion</div>
                <Rating value={4.4} />
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 10 }}>Bourbon · 8yr · 95 proof</div>
              </div>
              <div style={{ position: 'absolute', left: -60, bottom: 80, width: 200, padding: 18, background: 'var(--surf)', border: '1px solid var(--line-strong)' }}>
                <div className="kicker">◆ Nose</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, margin: '8px 0 0', fontStyle: 'italic', color: 'var(--ink-2)' }}>
                  "Toasted oak, wild cherry, a whisper of saddle leather."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES — three panels */}
      <section className="wrap" style={{ padding: '120px 48px 80px' }}>
        <Rule title="What You Get" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginTop: 32, background: 'var(--line)' }}>
          {[
            { kick: 'I.', title: 'Know what you\'re drinking', body: 'Mash bills, proof, provenance — the numbers and the story. Two thousand bottles and counting, each one hand-verified.' },
            { kick: 'II.', title: 'Keep honest notes', body: 'Log tastings in a format built for the ritual. Nose, palate, finish. Your memory has a shelf life. Your journal doesn\'t.' },
            { kick: 'III.', title: 'Build a shelf worth pouring', body: 'Lists, wishlists, and a personal flavor DNA that learns what you actually like — not what some algorithm guesses.' },
          ].map(f => (
            <div key={f.kick} style={{ background: 'var(--bg)', padding: '48px 36px' }}>
              <div className="display" style={{ fontSize: 48, color: 'var(--accent)' }}>{f.kick}</div>
              <div className="display italic" style={{ fontSize: 28, marginTop: 14 }}>{f.title}</div>
              <p style={{ color: 'var(--ink-2)', fontSize: 17, lineHeight: 1.55, marginTop: 14 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FULL-BLEED QUOTE */}
      <section style={{ padding: '120px 0', background: 'var(--surf)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', textAlign: 'center', position: 'relative' }}>
        <div className="wrap">
          <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;FROM THE DISPATCH</div>
          <p className="display italic" style={{ fontSize: 56, maxWidth: 1000, margin: '24px auto', lineHeight: 1.1 }}>
            "The good stuff has always been about the people pouring it. Firewater just keeps better notes than we do."
          </p>
          <Flourish width={180} />
          <div className="kicker" style={{ marginTop: 14 }}>— Imbibe Magazine</div>
        </div>
      </section>

      {/* FEATURED BOTTLES */}
      <section className="wrap" style={{ padding: '100px 48px' }}>
        <Rule title="This Week's Recommended" trailing="Vol. VII" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginTop: 32 }}>
          {[
            ['Widow\'s Watch', 'Rye · 12yr', 4.6],
            ['Brass Cartridge', 'Bourbon · 8yr', 4.3],
            ['Ghost Ranch', 'Añejo · 5yr', 4.7],
            ['Pale Lantern', 'Scotch · 18yr', 4.5],
          ].map(([name, sub, r]) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Bottle h={340} name={name.toUpperCase()} sub={sub.split('·')[0].trim()} year="2021" />
              </div>
              <div className="display italic" style={{ fontSize: 22, marginTop: 18 }}>{name}</div>
              <div className="kicker" style={{ marginTop: 4 }}>{sub}</div>
              <div style={{ marginTop: 10 }}><Rating value={r} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* APP CTA */}
      <section className="wrap" style={{ padding: '80px 48px 40px' }}>
        <div className="frame" style={{ padding: '64px 48px', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 48, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div>
            <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;THE APP</div>
            <h2 className="display italic" style={{ fontSize: 64, margin: '16px 0', lineHeight: 1 }}>
              Pocket-sized. Pours included.
            </h2>
            <p className="lede" style={{ maxWidth: 520 }}>
              Scan a bottle, log the pour, find the next one. The whole almanac in your coat pocket.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 28 }}>
              <button className="btn btn-primary">App Store</button>
              <button className="btn btn-ghost">Google Play</button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--accent)' }}>
            <Compass size={240} opacity={0.85} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="display" style={{ fontSize: 36, color: 'var(--accent)' }}>{n}</div>
      <div className="kicker" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}

window.Landing = Landing;
