// Discover.jsx — editorial feed, featured bottles
function Discover({ onNav }) {
  return (
    <div>
      <Masthead />

      <div className="wrap" style={{ padding: '40px 48px 0' }}>
        <div className="kicker accent" style={{ color: 'var(--accent)', textAlign: 'center' }}>◆ &nbsp;Discover &nbsp;·&nbsp; Vol. VII &nbsp;·&nbsp; Issue 04</div>
      </div>

      {/* EDITORIAL LEAD — asymmetric 3 column */}
      <section className="wrap" style={{ padding: '48px 48px 0', display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 40, borderBottom: '1px solid var(--line)', paddingBottom: 64 }}>
        {/* Lead story */}
        <article>
          <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;FEATURE</div>
          <h2 className="display italic" style={{ fontSize: 64, lineHeight: 1.02, margin: '14px 0' }}>
            The ghost distilleries of Kentucky are coming back.
          </h2>
          <Flourish width={180} />
          <p className="lede" style={{ marginTop: 18 }}>
            A dozen pre-Prohibition names are being resurrected — some by descendants, some by private equity. We tasted six of them.
          </p>
          <div className="kicker" style={{ marginTop: 18 }}>By R. Holloway &nbsp;·&nbsp; 12 min read</div>
          <div style={{ height: 360, marginTop: 24, background: 'linear-gradient(135deg, var(--surf-alt), var(--surf))', border: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 60%, color-mix(in srgb, var(--accent) 25%, transparent), transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: 20, left: 20, color: 'var(--ink-3)' }} className="kicker">Photo: W. Haynes, Bardstown</div>
          </div>
        </article>

        {/* Two stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <SideStory kicker="DISPATCH" title="Why &apos;craft&apos; lost its meaning — and what replaced it." by="A. Nieves" time="6 min" />
          <SideStory kicker="PROFILE" title="The last cooper in Dubuque." by="M. Ortega" time="9 min" />
          <SideStory kicker="REVIEW" title="Three ryes for a cold autumn porch." by="Firewater Desk" time="4 min" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <SideStory kicker="FIELD NOTE" title="A silent auction in West Texas." by="J. Carr" time="7 min" />
          <SideStory kicker="DEBATE" title="Is the 100-point scale broken?" by="K. Tate" time="11 min" />
          <SideStory kicker="GUIDE" title="How to build a shelf on a budget." by="Staff" time="5 min" />
        </div>
      </section>

      {/* TONIGHT'S POUR — wide feature */}
      <section className="wrap" style={{ padding: '80px 48px 0' }}>
        <Rule title="Tonight's Pour" trailing="Editor&apos;s Selection" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 48, marginTop: 40, alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Bottle h={480} name="WIDOW&apos;S WATCH" sub="Kentucky Rye" year="2016" />
          </div>
          <div>
            <div className="kicker">Kentucky · 12yr · 107 proof · $184</div>
            <h3 className="display italic" style={{ fontSize: 72, lineHeight: 1, margin: '14px 0 18px' }}>Widow's Watch</h3>
            <Rating value={4.6} size={14} />
            <p className="lede" style={{ marginTop: 20 }}>
              A high-rye mash aged in a second-floor warehouse that took a tornado in '09. Came out singing. The char gives it cedar smoke, but the long finish is all plum and pipe tobacco.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginTop: 32, borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '20px 0' }}>
              {[['NOSE', 'Cedar, cherry bark'], ['PALATE', 'Rye bread, dark honey'], ['FINISH', 'Tobacco, plum stone']].map(([k, v]) => (
                <div key={k}>
                  <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ {k}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 18, marginTop: 8 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button className="btn btn-primary" onClick={() => onNav('detail')}>Read Full Review →</button>
              <button className="btn btn-ghost">Add to Shelf</button>
            </div>
          </div>
        </div>
      </section>

      {/* VEINS OF SPIRIT — category tiles */}
      <section className="wrap" style={{ padding: '100px 48px 0' }}>
        <Rule title="Veins of Spirit" trailing="Explore by category" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, background: 'var(--line)', marginTop: 32 }}>
          {[
            ['Bourbon', 612], ['Rye', 284], ['Scotch', 431], ['Irish', 168],
            ['Agave', 392], ['Rum', 201], ['Gin', 146], ['Brandy', 98],
          ].map(([name, count]) => (
            <div key={name} style={{ background: 'var(--bg)', padding: '48px 28px', cursor: 'pointer', transition: 'background 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.background = 'var(--surf)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                 onClick={() => onNav('catalog')}>
              <div className="display italic" style={{ fontSize: 36 }}>{name}</div>
              <div className="kicker" style={{ marginTop: 8 }}>{count} bottles</div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SideStory({ kicker, title, by, time }) {
  return (
    <article style={{ borderBottom: '1px solid var(--line)', paddingBottom: 24 }}>
      <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;{kicker}</div>
      <h3 className="display italic" style={{ fontSize: 26, margin: '10px 0', lineHeight: 1.1 }}>{title}</h3>
      <div className="kicker">{by} &nbsp;·&nbsp; {time}</div>
    </article>
  );
}

window.Discover = Discover;
