// page-landing.jsx — Hero, value prop, features, app download CTA

function PageLanding({ onNav }) {
  const mode = document.body.dataset.mode;
  return (
    <div>
      {/* HERO — cinematic, bottle left, editorial right */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '80px 48px 100px' }}>
        {/* atmospheric background */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: mode === 'light' ? 0.07 : 0.09 }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="none">
            {[...Array(14)].map((_, i) => (
              <path key={i} d={`M0,${80 + i * 65} Q400,${50 + i * 65} 720,${90 + i * 65} T1440,${70 + i * 65}`}
                stroke="var(--accent)" strokeWidth="0.5" fill="none" />
            ))}
          </svg>
        </div>

        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 64, alignItems: 'center', position: 'relative' }}>
          {/* Left: bottle on pedestal */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, position: 'relative' }}>
            <div style={{
              position: 'absolute', width: 380, height: 380, borderRadius: '50%',
              background: mode === 'light'
                ? 'radial-gradient(circle, rgba(178,74,44,0.18), transparent 70%)'
                : 'radial-gradient(circle, rgba(224,184,104,0.12), transparent 70%)',
              top: '10%',
            }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <Bottle h={420} shade="amber" />
            </div>
            <div style={{ width: 240, height: 1, background: 'var(--accent)', opacity: 0.4 }} />
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <span className="label label-accent">◆ Featured</span>
              <div className="display" style={{ fontSize: 20, fontStyle: mode === 'dark' ? 'italic' : 'normal', fontWeight: mode === 'light' ? 700 : 400 }}>
                Elkhorn Creek Single Barrel
              </div>
            </div>
          </div>

          {/* Right: editorial copy */}
          <div>
            <div className="label label-accent" style={{ marginBottom: 20 }}>
              ◆ A Liquor Discovery Almanac
            </div>
            <h1 className="display" style={{
              fontSize: 88, lineHeight: 0.98, letterSpacing: '-0.02em',
              margin: 0, marginBottom: 28,
            }}>
              Every bottle<br/>
              <span style={{ color: 'var(--accent)' }}>tells a story.</span><br/>
              Yours starts here.
            </h1>
            <div style={{ fontFamily: 'var(--body)', fontSize: 22, lineHeight: 1.5, color: 'var(--ink-2)',
              fontStyle: mode === 'dark' ? 'italic' : 'normal',
              maxWidth: 560, marginBottom: 36,
            }}>
              Browse 2,000+ spirits across bourbon, scotch, tequila, mezcal and more.
              Log what you've tried, save what you're chasing, and trade notes with fellow enthusiasts.
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
              <button className="btn btn-primary" onClick={() => onNav('download')}>
                Get the app →
              </button>
              <button className="btn btn-outline" onClick={() => onNav('catalog')}>
                Browse catalog
              </button>
            </div>
            <div style={{ display: 'flex', gap: 40, paddingTop: 28, borderTop: '1px solid var(--line)' }}>
              {[['2,184', 'Bottles'], ['14', 'Spirit categories'], ['4.8', 'App Store rating']].map(([v, l]) => (
                <div key={l}>
                  <div className="display" style={{ fontSize: 36, lineHeight: 1 }}>{v}</div>
                  <div className="label" style={{ marginTop: 6 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE — ribbon of spirit categories */}
      <section style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'var(--surf)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 48, padding: '20px 0', whiteSpace: 'nowrap', animation: 'marquee 40s linear infinite' }}>
          {[...Array(3)].flatMap((_, r) =>
            ['Bourbon', 'Rye', 'Scotch', 'Irish', 'Japanese', 'Tequila', 'Mezcal', 'Rum', 'Gin', 'Vodka', 'Cognac', 'Armagnac'].map((s, i) => (
              <div key={`${r}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
                <div className="display" style={{ fontSize: 34, letterSpacing: '-0.01em' }}>{s}</div>
                <span style={{ color: 'var(--accent)', fontSize: 14 }}>✦</span>
              </div>
            ))
          )}
        </div>
        <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }`}</style>
      </section>

      {/* WHY FIREWATER — three pillars, editorial */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="label label-accent" style={{ marginBottom: 14 }}>◆ Why Firewater</div>
            <h2 className="display" style={{ fontSize: 56, lineHeight: 1.05, margin: 0, letterSpacing: '-0.01em' }}>
              Not another rating app.
            </h2>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
              <Ornament width={160} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {[
              ['Curated', 'Every bottle vetted', 'Not a user-submitted dumping ground. A hand-maintained reference of 2,000+ bottles you\'d actually want to try.'],
              ['Personal', 'A catalog that learns', 'Tell us what you reach for; we tune the discovery. Your Flavor DNA, Top Shelf, and Proof Persona evolve with every pour.'],
              ['Social', 'Trade notes, not rankings', 'Follow collectors with a palate close to yours. Read their journals. Skip the 5-star arms race.'],
            ].map(([tag, title, body], i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.22em' }}>
                    0{i+1}
                  </div>
                  <div className="label" style={{ fontSize: 10 }}>{tag}</div>
                </div>
                <h3 className="display" style={{ fontSize: 30, lineHeight: 1.1, margin: 0, letterSpacing: '-0.01em' }}>
                  {title}
                </h3>
                <div style={{ fontFamily: 'var(--body)', fontSize: 17, lineHeight: 1.55, color: 'var(--ink-2)',
                  fontStyle: mode === 'dark' ? 'italic' : 'normal' }}>
                  {body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BIG VISUAL MOMENT — bottle wall */}
      <section style={{ padding: '60px 48px 100px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div className="label label-accent" style={{ marginBottom: 14 }}>◆ The Cellar</div>
              <h2 className="display" style={{ fontSize: 56, lineHeight: 1.05, margin: 0, letterSpacing: '-0.01em', marginBottom: 20 }}>
                A living catalog of two thousand pours.
              </h2>
              <div style={{ fontFamily: 'var(--body)', fontSize: 19, lineHeight: 1.55, color: 'var(--ink-2)',
                fontStyle: mode === 'dark' ? 'italic' : 'normal', marginBottom: 28 }}>
                Filter by mash bill, region, proof, price, finish — or just by the feeling you're chasing tonight.
                Every entry carries tasting notes, provenance, and what fellow enthusiasts have poured into it.
              </div>
              <button className="btn btn-outline" onClick={() => onNav('catalog')}>
                Browse all 2,184 →
              </button>
            </div>
            <div style={{
              background: 'var(--surf)', border: '1px solid var(--line)',
              padding: 32, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24, alignItems: 'end',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, var(--accent) 20%, var(--accent) 80%, transparent)`, opacity: 0.6 }} />
              {['amber', 'dark', 'light', 'amber', 'clear', 'dark', 'amber', 'light', 'amber', 'dark'].map((shade, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'center', opacity: i < 5 ? 1 : 0.85 }}>
                  <Bottle h={i < 5 ? 130 : 100} shade={shade} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE: FLAVOR DNA */}
      <section style={{ padding: '80px 48px', background: 'var(--surf)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 80, alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ padding: 40, background: 'var(--bg)', border: '1px solid var(--line)' }}>
              <FlavorRadar data={[
                { k: 'SWEET', v: 7.2 }, { k: 'OAK', v: 8.1 }, { k: 'SPICE', v: 6.4 },
                { k: 'SMOKE', v: 3.2 }, { k: 'FRUIT', v: 6.8 }, { k: 'HEAT', v: 5.1 },
              ]} size={300} />
            </div>
          </div>
          <div>
            <div className="label label-accent" style={{ marginBottom: 14 }}>◆ Your Flavor DNA</div>
            <h2 className="display" style={{ fontSize: 52, lineHeight: 1.05, margin: 0, letterSpacing: '-0.01em', marginBottom: 20 }}>
              A palate<br/>mapped in six<br/>dimensions.
            </h2>
            <div style={{ fontFamily: 'var(--body)', fontSize: 18, lineHeight: 1.55, color: 'var(--ink-2)',
              fontStyle: mode === 'dark' ? 'italic' : 'normal', marginBottom: 24 }}>
              Every bottle you log sharpens your Flavor DNA — a radar of what you actually reach for
              across sweet, oak, spice, smoke, fruit, and heat. Share it, compare it, and let it tune
              your recommendations.
            </div>
            <div onClick={() => onNav('profile')} className="label" style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4 }}>
              See a sample profile →
            </div>
          </div>
        </div>
      </section>

      {/* THE DISPATCH TEASE */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div className="label label-accent" style={{ marginBottom: 10 }}>◆ The Dispatch · Vol. VII</div>
              <h2 className="display" style={{ fontSize: 48, lineHeight: 1, margin: 0, letterSpacing: '-0.01em' }}>
                A weekly field guide<br/>to what's in the glass.
              </h2>
            </div>
            <button className="btn btn-outline" onClick={() => onNav('dispatch')}>
              Read all issues →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              ['01', 'A quiet case for wheated mash', 'Essay · 4 min'],
              ['02', 'Six ryes under fifty', 'Field guide · 7 min'],
              ['03', 'How finish wood rewrites palate', 'Primer · 6 min'],
            ].map(([no, title, meta]) => (
              <div key={no} onClick={() => onNav('article')} style={{
                border: '1px solid var(--line)', padding: 28, background: 'var(--surf)',
                cursor: 'pointer', transition: '0.2s all',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <PhotoPlaceholder h={180} label={meta.split(' · ')[0]} tint={['amber','smoke','bone'][parseInt(no) - 1]} />
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginTop: 20 }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.22em' }}>{no}</div>
                  <div className="label" style={{ fontSize: 9 }}>{meta}</div>
                </div>
                <h3 className="display" style={{ fontSize: 24, lineHeight: 1.15, margin: '10px 0 0', letterSpacing: '-0.005em' }}>
                  {title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '100px 48px', textAlign: 'center',
        background: `radial-gradient(ellipse at center top, color-mix(in srgb, var(--accent) 8%, transparent), transparent 70%)`,
        borderTop: '1px solid var(--line)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Compass size={48} op={0.8} />
          <h2 className="display" style={{ fontSize: 72, lineHeight: 1, letterSpacing: '-0.02em', margin: '24px 0 20px' }}>
            What fire are<br/>you chasing?
          </h2>
          <div style={{ fontFamily: 'var(--body)', fontSize: 20, lineHeight: 1.5, color: 'var(--ink-2)',
            fontStyle: mode === 'dark' ? 'italic' : 'normal', maxWidth: 560, margin: '0 auto 36px' }}>
            Download Firewater on iOS, or explore the catalog on the web. Free to browse,
            free to log, built for enthusiasts.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => onNav('download')}>Get the iOS app</button>
            <button className="btn btn-outline" onClick={() => onNav('signin')}>Sign up free</button>
          </div>
        </div>
      </section>
    </div>
  );
}

window.PageLanding = PageLanding;
