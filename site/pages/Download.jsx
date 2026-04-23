// Download.jsx — get the app
function Download({ onNav }) {
  return (
    <div>
      <section style={{ position: 'relative', minHeight: 720, overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 30%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 55%), radial-gradient(ellipse at 80% 70%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 55%)' }} />
        <div className="wrap" style={{ position: 'relative', padding: '96px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;GET FIREWATER</div>
            <h1 className="display italic" style={{ fontSize: 104, margin: '16px 0', lineHeight: 0.98 }}>
              The almanac, <span style={{ color: 'var(--accent)' }}>pocket-sized.</span>
            </h1>
            <Flourish width={220} />
            <p className="lede" style={{ marginTop: 22, maxWidth: 540 }}>
              Scan a bottle. Log a pour. Find the next one. Free, no ads, no hidden tiers. Available for iOS and Android.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 36 }}>
              <a className="btn btn-primary">
                <span style={{ fontSize: 20, marginRight: 4 }}></span>
                App Store
              </a>
              <a className="btn btn-ghost">
                <span style={{ fontSize: 18, marginRight: 4 }}>▶</span>
                Google Play
              </a>
            </div>
            <div style={{ marginTop: 40, display: 'flex', gap: 32 }}>
              <div>
                <div className="display" style={{ fontSize: 28, color: 'var(--accent)' }}>4.8 ◆</div>
                <div className="kicker">App Store · 12k ratings</div>
              </div>
              <div>
                <div className="display" style={{ fontSize: 28, color: 'var(--accent)' }}>Editor's Choice</div>
                <div className="kicker">Apple, Nov 2026</div>
              </div>
            </div>
          </div>

          {/* Phone mock */}
          <div style={{ display: 'flex', justifyContent: 'center', perspective: 1600 }}>
            <div style={{
              width: 340, height: 690,
              background: 'var(--surf-alt)',
              border: '12px solid #0a0806', borderRadius: 48,
              boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 10px 30px color-mix(in srgb, var(--accent) 20%, transparent)',
              transform: 'rotateY(-8deg) rotateX(2deg)',
              overflow: 'hidden', position: 'relative',
            }}>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <div className="kicker accent" style={{ color: 'var(--accent)', marginTop: 28 }}>◆ TONIGHT'S POUR</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                  <Bottle h={280} name="WIDOW'S WATCH" sub="Rye" year="2016" />
                </div>
                <div className="display italic" style={{ fontSize: 28, marginTop: 18 }}>Widow's Watch</div>
                <Rating value={4.6} />
                <div className="kicker" style={{ marginTop: 8 }}>Kentucky · 12yr · 107°</div>
                <button className="btn btn-primary" style={{ marginTop: 24, width: '80%' }}>Log a Pour</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="wrap" style={{ padding: '120px 48px 0' }}>
        <Rule title="In Your Pocket" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, background: 'var(--line)', marginTop: 32 }}>
          {[
            ['Scan', 'Point the camera at any bottle. Get the full dossier in two seconds.'],
            ['Log', 'Nose. Palate. Finish. A template for the ritual.'],
            ['Sync', 'Notes follow you to web. Web follows you back.'],
            ['Offline', 'Full catalog cached. Works in the rickhouse, works on the plane.'],
          ].map(([t, b]) => (
            <div key={t} style={{ background: 'var(--bg)', padding: '40px 28px' }}>
              <div className="display italic" style={{ fontSize: 36, color: 'var(--accent)' }}>◆</div>
              <div className="display italic" style={{ fontSize: 30, marginTop: 10 }}>{t}</div>
              <p style={{ color: 'var(--ink-2)', fontSize: 16, marginTop: 10, lineHeight: 1.5 }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

window.Download = Download;
