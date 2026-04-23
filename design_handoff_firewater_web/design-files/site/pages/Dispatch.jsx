// Dispatch.jsx — articles index
function Dispatch({ onNav }) {
  return (
    <div>
      <Masthead />

      <section className="wrap" style={{ padding: '56px 48px 0', textAlign: 'center' }}>
        <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;THE DISPATCH &nbsp;·&nbsp; ARCHIVE</div>
        <h1 className="display italic" style={{ fontSize: 84, margin: '16px 0', lineHeight: 1 }}>Field Writing</h1>
        <Flourish width={180} />
        <p className="lede" style={{ maxWidth: 620, margin: '22px auto 0' }}>
          Long reads, profiles, debates, and guides. Sent monthly. Read here anytime.
        </p>
      </section>

      {/* Featured */}
      <section className="wrap" style={{ padding: '72px 48px 0' }}>
        <Rule title="This Week" />
        <article onClick={() => onNav('article')} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, marginTop: 32, cursor: 'pointer', alignItems: 'center' }}>
          <div style={{ height: 480, background: 'linear-gradient(135deg, var(--surf-alt), var(--surf))', border: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 60%, color-mix(in srgb, var(--accent) 25%, transparent), transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: 20, left: 20 }} className="kicker">Photo: W. Haynes</div>
          </div>
          <div>
            <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ FEATURE &nbsp;·&nbsp; 12 MIN READ</div>
            <h2 className="display italic" style={{ fontSize: 56, lineHeight: 1.02, margin: '14px 0' }}>
              The ghost distilleries of Kentucky are coming back.
            </h2>
            <p className="lede">A dozen pre-Prohibition names are being resurrected — some by descendants, some by private equity. We tasted six of them.</p>
            <div className="kicker" style={{ marginTop: 18 }}>By R. Holloway &nbsp;·&nbsp; Nov 04, 2026</div>
          </div>
        </article>
      </section>

      {/* Grid of all articles */}
      <section className="wrap" style={{ padding: '100px 48px 0' }}>
        <Rule title="The Archive" trailing="168 dispatches" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, marginTop: 32 }}>
          {[
            ['DEBATE', "Is the 100-point scale broken?", 'K. Tate', '11 min'],
            ['PROFILE', 'The last cooper in Dubuque.', 'M. Ortega', '9 min'],
            ['FIELD NOTE', 'A silent auction in West Texas.', 'J. Carr', '7 min'],
            ['GUIDE', 'How to build a shelf on a budget.', 'Staff', '5 min'],
            ['REVIEW', 'Three ryes for a cold autumn porch.', 'Firewater Desk', '4 min'],
            ['ESSAY', "Why 'craft' lost its meaning.", 'A. Nieves', '6 min'],
            ['FEATURE', 'The fire that rebuilt a distillery.', 'R. Holloway', '14 min'],
            ['INTERVIEW', 'A conversation with a cask master.', 'M. Ortega', '8 min'],
            ['DISPATCH', 'A week in the Jalisco highlands.', 'J. Carr', '10 min'],
          ].map(([kick, title, by, time], i) => (
            <article key={i} onClick={() => onNav('article')} style={{ cursor: 'pointer', borderTop: '1px solid var(--line)', paddingTop: 20 }}>
              <div style={{ height: 180, background: 'var(--surf)', border: '1px solid var(--line)', marginBottom: 18, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at ${30 + i * 8}% ${40 + i * 6}%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%)` }} />
              </div>
              <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ {kick}</div>
              <h3 className="display italic" style={{ fontSize: 26, lineHeight: 1.1, margin: '10px 0' }}>{title}</h3>
              <div className="kicker">{by} &nbsp;·&nbsp; {time}</div>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="wrap" style={{ padding: '100px 48px 40px' }}>
        <div className="frame" style={{ padding: '56px 48px', textAlign: 'center' }}>
          <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;SUBSCRIBE</div>
          <h3 className="display italic" style={{ fontSize: 52, margin: '14px 0' }}>The Dispatch, in your mailbox.</h3>
          <p className="lede" style={{ maxWidth: 540, margin: '0 auto 28px' }}>Monthly. Free. One long read, three short ones, and a new pour to try.</p>
          <div style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto' }}>
            <input placeholder="your@email.com" style={{ flex: 1, padding: '16px 18px', border: '1px solid var(--line-strong)', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 16 }} />
            <button className="btn btn-primary">Subscribe</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

window.Dispatch = Dispatch;
