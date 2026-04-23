// About.jsx — the makers
function About({ onNav }) {
  return (
    <div>
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -180, top: -60, opacity: 0.06 }}>
          <Compass size={640} opacity={1} />
        </div>
        <div className="wrap" style={{ position: 'relative', padding: '120px 48px 80px', maxWidth: 1100 }}>
          <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;ABOUT</div>
          <h1 className="display italic" style={{ fontSize: 112, lineHeight: 0.98, margin: '20px 0' }}>
            We keep <span style={{ color: 'var(--accent)' }}>honest notes</span> on the good stuff.
          </h1>
          <Flourish width={240} />
          <p className="lede" style={{ fontSize: 24, maxWidth: 780, marginTop: 28 }}>
            Firewater is a small independent field guide to American spirits — bourbon, rye, agave, and everything adjacent. We started because the existing apps were either trying to sell us things or drowning us in scores. Neither felt like the ritual.
          </p>
        </div>
      </section>

      {/* Mission / manifesto */}
      <section style={{ background: 'var(--surf)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap" style={{ padding: '100px 48px' }}>
          <Rule title="The Three Rules" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, marginTop: 48 }}>
            {[
              ['I.', 'The bottle comes first.', 'Every entry in the catalog is hand-verified. If we haven\'t seen it, held it, or poured it, it\'s not in here.'],
              ['II.', 'The notes are yours.', 'We don\'t sell your taste. Your shelf, your pours, your honest opinions — they belong to you.'],
              ['III.', 'No paid placements.', 'No sponsored bottles, no boosted reviews, no "editor\'s choice" up for sale. The dispatch pays for itself.'],
            ].map(([n, title, body]) => (
              <div key={n}>
                <div className="display" style={{ fontSize: 96, color: 'var(--accent)', lineHeight: 1 }}>{n}</div>
                <div className="display italic" style={{ fontSize: 32, marginTop: 14 }}>{title}</div>
                <p style={{ color: 'var(--ink-2)', fontSize: 17, marginTop: 14, lineHeight: 1.55 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="wrap" style={{ padding: '100px 48px' }}>
        <Rule title="The Desk" trailing="Five humans, one cat" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginTop: 40 }}>
          {[
            ['R. Holloway', 'Editor', 'Former cooper. Writes the long ones.'],
            ['A. Nieves', 'Catalog', 'Has tasted more than is wise.'],
            ['M. Ortega', 'Profiles', 'Finds people. Asks them questions.'],
            ['K. Tate', 'Engineering', 'Builds the thing. Breaks it on purpose.'],
          ].map(([name, role, bio]) => (
            <div key={name}>
              <div style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg, var(--surf-alt), var(--surf))', border: '1px solid var(--line)' }} />
              <div className="display italic" style={{ fontSize: 26, marginTop: 16 }}>{name}</div>
              <div className="kicker accent" style={{ color: 'var(--accent)', marginTop: 4 }}>◆ {role}</div>
              <p style={{ color: 'var(--ink-2)', fontSize: 15, marginTop: 10, fontStyle: 'italic' }}>{bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Colophon */}
      <section className="wrap" style={{ padding: '0 48px 80px' }}>
        <div className="frame" style={{ padding: '48px 48px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48 }}>
          <div>
            <Rule title="Colophon" align="left" />
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2)' }}>
            <p>Set in <span className="mono" style={{ color: 'var(--accent)' }}>DM Serif Display</span> (Dusk mode), <span className="mono" style={{ color: 'var(--accent)' }}>Old Standard TT</span> (Sundown mode), with running text in Cormorant &amp; Tenor Sans, and micro-labels in JetBrains Mono.</p>
            <p>Designed in Marfa and built in Louisville. Hand-coded HTML and CSS. No tracking. No third-party analytics. No paid placements, ever.</p>
            <p className="kicker" style={{ marginTop: 20 }}>◆ &nbsp;EST. MMXXIV &nbsp;·&nbsp; VOLUME VII</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

window.About = About;
