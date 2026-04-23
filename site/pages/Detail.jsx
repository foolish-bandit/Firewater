// Detail.jsx — bottle detail page
function Detail({ onNav }) {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="wrap" style={{ padding: '28px 48px 0' }}>
        <div className="kicker">
          <span onClick={() => onNav('catalog')} style={{ cursor: 'pointer' }}>Catalog</span>
          &nbsp;/&nbsp; Bourbon &nbsp;/&nbsp; <span style={{ color: 'var(--accent)' }}>Widow's Watch</span>
        </div>
      </div>

      {/* Hero */}
      <section className="wrap" style={{ padding: '48px 48px 80px', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 80, alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Bottle h={640} name="WIDOW'S WATCH" sub="Kentucky Rye" year="2016" />
        </div>
        <div>
          <div className="kicker">Kentucky · Rye · 12 yr · 107 proof</div>
          <h1 className="display italic" style={{ fontSize: 96, lineHeight: 0.98, margin: '18px 0 22px' }}>Widow's Watch</h1>
          <Flourish width={200} />
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 22 }}>
            <Rating value={4.6} size={14} />
            <span className="kicker">847 reviews</span>
            <span className="display" style={{ fontSize: 32, color: 'var(--accent)' }}>$184</span>
          </div>
          <p className="lede" style={{ marginTop: 24, maxWidth: 560 }}>
            A high-rye mash aged in a second-floor warehouse that took a tornado in '09. Came out singing — the char gives it cedar smoke, with a long finish of plum and pipe tobacco.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <button className="btn btn-primary">Add to Shelf</button>
            <button className="btn btn-ghost">Log a Pour</button>
            <button className="btn btn-ghost">♡ Wishlist</button>
          </div>
        </div>
      </section>

      {/* Specs strip */}
      <section style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'var(--surf)' }}>
        <div className="wrap" style={{ padding: '32px 48px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 32 }}>
          {[['DISTILLERY', 'Ashford & Co.'], ['REGION', 'Bardstown, KY'], ['MASH BILL', '65% Rye'], ['AGE', '12 years'], ['PROOF', '107°'], ['FINISH', 'Virgin Oak']].map(([k, v]) => (
            <div key={k}>
              <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ {k}</div>
              <div className="display" style={{ fontSize: 22, marginTop: 8 }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tasting notes + flavor */}
      <section className="wrap" style={{ padding: '80px 48px', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 64 }}>
        <div>
          <Rule title="Tasting Notes" align="left" />
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
            {[
              ['NOSE', 'Cedar bark, wild cherry, saddle leather. A whisper of char underneath — the rye bread almost hidden.'],
              ['PALATE', 'Opens with rye spice, moves to dark honey and orange peel. Midpalate turns cooler: mint, cracked pepper, a memory of smoke.'],
              ['FINISH', 'Long and dry. Tobacco leaf, plum stone, and a resin-bright sweetness that hangs on the back of the tongue for a full minute.'],
            ].map(([k, v]) => (
              <div key={k} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 22 }}>
                <div className="kicker accent" style={{ color: 'var(--accent)', marginBottom: 10 }}>◆ {k}</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 21, lineHeight: 1.55, margin: 0, fontStyle: 'italic', color: 'var(--ink)' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Rule title="Flavor DNA" align="left" />
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['Oak', 0.82], ['Spice', 0.78], ['Fruit', 0.55], ['Smoke', 0.41], ['Sweet', 0.38], ['Floral', 0.22]].map(([k, v]) => (
              <div key={k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="kicker">{k}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{Math.round(v * 100)}</span>
                </div>
                <div style={{ height: 4, background: 'var(--line)' }}>
                  <div style={{ height: '100%', width: `${v * 100}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40 }}>
            <Rule title="Serve It" align="left" />
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Neat, in a Glencairn', 'One large rock', 'Avoid water — it flattens'].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                  <span className="mono" style={{ color: 'var(--accent)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 17 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="wrap" style={{ padding: '0 48px 80px' }}>
        <Rule title="Field Notes · 847 Reviews" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginTop: 32 }}>
          {[
            ['J. Carr', 'Marfa, TX', 4.8, 'Bought a bottle off a back shelf in Alpine. Tasted it on the porch. Wife said I looked twenty years younger.'],
            ['R. Holloway', 'Louisville, KY', 4.5, 'Been drinking rye for thirty years. This one surprised me. The finish is what the fuss is about.'],
            ['A. Nieves', 'Oakland, CA', 4.7, 'Picked up for an anniversary. Shared with my father-in-law. He said very little, which for him is a rave.'],
          ].map(([name, place, r, body]) => (
            <article key={name} style={{ background: 'var(--surf)', border: '1px solid var(--line)', padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="display italic" style={{ fontSize: 20 }}>{name}</div>
                <Rating value={r} />
              </div>
              <div className="kicker" style={{ marginTop: 4 }}>{place}</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 18, lineHeight: 1.5 }}>"{body}"</p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

window.Detail = Detail;
