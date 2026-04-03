import React, { useState, useRef } from 'react';
import { X, Mail, Phone, Chrome } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface AuthModalProps {
  onClose: () => void;
  onGoogleSignIn: () => void;
  onCredentialAuth: (user: any, token?: string) => void;
}

type AuthMode = 'signin' | 'signup';
type AuthMethod = 'google' | 'email' | 'phone';

export default function AuthModal({ onClose, onGoogleSignIn, onCredentialAuth }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [method, setMethod] = useState<AuthMethod>('google');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, onClose, [mode, method]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && !ageConfirmed) {
      setError('You must confirm that you are 21 years of age or older');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const body: any = { identifier, password, type: method };
      if (mode === 'signup') body.name = name;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      onCredentialAuth(data.user, data.token);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    onGoogleSignIn();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-base/90 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Sign In"
    >
      <div ref={modalRef} className="surface-raised p-6 md:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-muted hover:text-on-surface-accent transition-colors z-10"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <p className="micro-label mb-2 text-on-surface-accent">
            {mode === 'signin' ? 'Welcome Back' : 'Join The Club'}
          </p>
          <h2 className="font-serif text-2xl font-normal text-on-surface">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
        </div>

        {/* Method tabs */}
        <div className="flex gap-2 mb-6">
          {(['google', 'email', 'phone'] as AuthMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMethod(m); setError(''); }}
              className={`flex-1 seg-item flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 text-[10px] sm:text-xs tracking-wider sm:tracking-widest ${
                method === m ? 'seg-item-active' : ''
              }`}
            >
              {m === 'google' && <Chrome size={14} />}
              {m === 'email' && <Mail size={14} />}
              {m === 'phone' && <Phone size={14} />}
              {m}
            </button>
          ))}
        </div>

        {/* Google */}
        {method === 'google' && (
          <button
            onClick={handleGoogleClick}
            className="btn btn-secondary btn-md w-full"
          >
            <Chrome size={18} />
            Continue with Google
          </button>
        )}

        {/* Email / Phone form */}
        {method !== 'google' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1.5">
                  Display Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base px-4 py-2.5 text-sm"
                  placeholder="Pick a name (or leave blank to stay anonymous)"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-identifier" className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1.5">
                {method === 'email' ? 'Email' : 'Phone Number'}
              </label>
              <input
                id="auth-identifier"
                type={method === 'email' ? 'email' : 'tel'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="input-base px-4 py-2.5 text-sm"
                placeholder={method === 'email' ? 'you@example.com' : '+1 (555) 123-4567'}
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1.5">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input-base px-4 py-2.5 text-sm"
                placeholder="Min. 8 characters"
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-confirm-password" className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input-base px-4 py-2.5 text-sm"
                  placeholder="Re-enter password"
                />
              </div>
            )}

            {mode === 'signup' && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-on-surface-accent cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-on-surface-secondary group-hover:text-on-surface transition-colors leading-snug">
                  I confirm that I am <strong className="text-on-surface-accent">21 years of age or older</strong> and of legal drinking age in my jurisdiction.
                </span>
              </label>
            )}

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'signup' && !ageConfirmed)}
              className="btn btn-secondary btn-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Toggle mode */}
        <p className="text-center text-sm text-on-surface-muted mt-6">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setAgeConfirmed(false); }}
            className="text-on-surface-accent hover:underline font-semibold"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
