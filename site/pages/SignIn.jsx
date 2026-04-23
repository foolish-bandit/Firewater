// SignIn.jsx — sign in / sign up
const { useState: useSInState } = React;

function SignIn({ onNav }) {
  const [mode, setMode] = useSInState('signin');
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left: atmosphere */}
      <div style={{ position: 'relative', borderRight: '1px solid var(--line)', background: 'var(--surf)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 55%), radial-gradient(ellipse at 70% 80%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: 60, left: 60, right: 60 }}>
          <div className="kicker accent" style={{ color: 'var(--accent)' }}>◆ &nbsp;EST. MMXXIV &nbsp;·&nbsp; VOL. VII</div>
          <h2 className="display italic" style={{ fontSize: 72, lineHeight: 1, margin: '16px 0' }}>
            The shelf remembers,<br/>so you don't have to.
          </h2>
          <Flourish width={200} />
          <p className="lede" style={{ marginTop: 20, maxWidth: 440 }}>
            Every bottle you've logged. Every pour you've noted. Every friend you've followed. Waiting right where you left them.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 40px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="display italic" style={{ fontSize: 52 }}>Fire<span style={{ color: 'var(--accent)' }}>·</span>water</div>
            <Flourish width={140} />
          </div>

          {/* Toggle */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: 36 }}>
            {[['signin', 'Sign In'], ['signup', 'Create Account']].map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)}
                      style={{
                        flex: 1, padding: '14px 0', border: 0, background: 'transparent',
                        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.22em',
                        textTransform: 'uppercase', cursor: 'pointer',
                        color: mode === k ? 'var(--accent)' : 'var(--ink-2)',
                        borderBottom: mode === k ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: -1,
                      }}>{l}</button>
            ))}
          </div>

          {mode === 'signup' && <Field label="Name" placeholder="Jack Carr" />}
          <Field label="Email" placeholder="you@firewater.app" />
          <Field label="Password" type="password" placeholder="••••••••" />
          {mode === 'signin' && (
            <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 20 }}>
              <a className="kicker" style={{ cursor: 'pointer', color: 'var(--accent)' }}>Forgot?</a>
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '18px' }}>
            {mode === 'signin' ? 'Sign In →' : 'Create Account →'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '32px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span className="kicker">OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>Continue with Apple</button>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Continue with Google</button>

          <p className="kicker" style={{ textAlign: 'center', marginTop: 36, color: 'var(--ink-3)' }}>
            ◆ &nbsp;Must be 21+ to create an account &nbsp;◆
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label className="kicker" style={{ display: 'block', marginBottom: 8 }}>◆ {label}</label>
      <input type={type} placeholder={placeholder}
             style={{
               width: '100%', padding: '14px 18px',
               border: '1px solid var(--line-strong)', background: 'var(--bg)',
               color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 18,
               outline: 'none',
             }}
             onFocus={e => e.target.style.borderColor = 'var(--accent)'}
             onBlur={e => e.target.style.borderColor = 'var(--line-strong)'}
      />
    </div>
  );
}

window.SignIn = SignIn;
