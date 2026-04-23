// Article.jsx — long-form reading view
function Article({ onNav }) {
  return (
    <div>
      {/* Full-bleed cover */}
      <section style={{ height: 580, position: 'relative', borderBottom: '1px solid var(--line)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, var(--surf-alt), var(--surf))' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 60%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 60%), radial-gradient(ellipse at 80% 30%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, color-mix(in srgb, var(--bg) 95%, transparent) 100%)' }} />
        <div className="wrap" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px' }}>
          <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;FEATURE &nbsp;·&nbsp; 12 MIN READ</div>
          <h1 className="display italic" style={{ fontSize: 96, lineHeight: 0.98, margin: '18px 0', maxWidth: 1100 }}>
            The ghost distilleries of Kentucky are coming back.
          </h1>
          <div className="kicker">By R. Holloway &nbsp;·&nbsp; Photographs by W. Haynes &nbsp;·&nbsp; Nov 04, 2026</div>
        </div>
      </section>

      {/* Body */}
      <article style={{ maxWidth: 780, margin: '0 auto', padding: '80px 24px' }}>
        <p className="lede" style={{ fontSize: 26, lineHeight: 1.4 }}>
          <span className="display" style={{ fontSize: 96, float: 'left', lineHeight: 0.82, margin: '4px 14px 0 0', color: 'var(--accent)' }}>A</span>
          dozen pre-Prohibition distillery names are being resurrected across Kentucky and Tennessee — some by descendants who kept the rickhouse keys, some by private equity with a marketing deck. We went looking for the real ones.
        </p>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 21, lineHeight: 1.65, marginTop: 32 }}>
          The first thing you notice in Bardstown is how much it still smells like bread. A sour-mash smell, yeasty and faintly burnt, that hangs over the whole town on a still morning. The distilleries have come and gone here for two hundred years, but the smell never really leaves.
        </p>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 21, lineHeight: 1.65, marginTop: 20 }}>
          We met John Ashford on the porch of a warehouse that hadn't produced a drop since 1919. His great-grandfather built it. The walls still have the bourbon-soaked fungus climbing them, black as pitch. "I grew up being told not to come here," he said. "My dad called it the haunted building."
        </p>

        <Rule title="I. The Lost Names" />

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 21, lineHeight: 1.65, marginTop: 20 }}>
          There are thirty-seven distilleries in the Kentucky Distillers' Association today. In 1918 there were over two hundred. Prohibition closed most of them, and the ones that reopened in 1933 were the ones with the best lawyers, not always the best whiskey.
        </p>

        <blockquote style={{ borderLeft: '3px solid var(--accent)', padding: '8px 0 8px 28px', margin: '40px 0', fontStyle: 'italic', fontFamily: 'var(--font-body)', fontSize: 26, lineHeight: 1.4, color: 'var(--ink)' }}>
          "My grandfather used to say the good whiskey wasn't the whiskey that survived. It was the whiskey that got remembered."
        </blockquote>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 21, lineHeight: 1.65, marginTop: 20 }}>
          The names on the tombstones are coming back. Ashford & Co. The Widow's Watch distillery — named for the observation room on the top floor where distiller's wives would look for their husbands coming home from the warehouse fires. Stonewall, Brass Cartridge, Four Winds. Each of them has a story; not all of them are true.
        </p>

        {/* Pull image */}
        <div style={{ height: 480, margin: '56px -80px', background: 'linear-gradient(135deg, var(--surf-alt), var(--surf))', border: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 50%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 20 }} className="kicker">A rickhouse at dawn, Bardstown, KY. W. Haynes.</div>
        </div>

        <Rule title="II. What's in the Bottle" />

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 21, lineHeight: 1.65, marginTop: 20 }}>
          We tasted six revivals over two days. Some of them were good. One of them was, frankly, better than anything from a mainstream distillery I've put in a glass this decade. Three of them were sourced juice with a new label — perfectly fine whiskey, dressed up with a story that belongs to someone else.
        </p>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 21, lineHeight: 1.65, marginTop: 20 }}>
          Here's the honest thing: the good ones are worth the price. The story ones are not. But telling them apart requires you to taste them, and that requires you to buy a bottle, and that means the story is doing its job whether you want it to or not.
        </p>
      </article>

      {/* Related */}
      <section className="wrap" style={{ padding: '40px 48px 0', borderTop: '1px solid var(--line)' }}>
        <Rule title="Keep Reading" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, marginTop: 32 }}>
          {[
            ['PROFILE', 'The last cooper in Dubuque.', '9 min'],
            ['DEBATE', 'Is the 100-point scale broken?', '11 min'],
            ['FIELD NOTE', 'A silent auction in West Texas.', '7 min'],
          ].map(([k, t, time]) => (
            <article key={t} onClick={() => onNav('article')} style={{ cursor: 'pointer' }}>
              <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ {k}</div>
              <h3 className="display italic" style={{ fontSize: 28, lineHeight: 1.1, margin: '10px 0' }}>{t}</h3>
              <div className="kicker">{time}</div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

window.Article = Article;
