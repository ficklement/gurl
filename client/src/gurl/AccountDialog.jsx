import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { authClient } from '../auth-client.js';

export default function AccountDialog({ onClose }) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (mode === 'forgot') {
        const result = await authClient.requestPasswordReset({ email, redirectTo: window.location.origin + '/reset-password' });
        if (result.error) throw new Error(result.error.message || 'Reset request failed.');
        setMode('sent');
        return;
      }
      const result = mode === 'signin'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email(
            { name, email, password },
            { headers: { 'x-captcha-response': captchaToken } }
          );

      if (result.error) {
        throw new Error(result.error.message || 'Authentication failed.');
      }

      onClose();
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gurl-auth-overlay" onMouseDown={onClose}>
      <div
        className="gurl-auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'signin' ? 'Sign in to GURL' : 'Create a GURL account'}
        onMouseDown={event => event.stopPropagation()}
      >
        <button
          className="gurl-auth-close"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="eyebrow">KAISER'S PRIVATE JOURNAL</div>
        <h2>{mode === 'signin' ? 'Welcome back, gurl.' : 'Join the cosmic chaos.'}</h2>
        <p>Save your chart and keep every compatibility reading in one place.</p>

        {mode === 'sent' ? (
          <p role="status">
            Check your inbox, gurl! If that email belongs to an
            account, your password-reset link is on its way.
          </p>
        ) : (
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              Display name
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={80}
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          {mode !== 'forgot' && <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>}

          {mode === 'signup' && (
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken('')}
              onError={() => setCaptchaToken('')}
            />
          )}

          {error && <p className="gurl-auth-error" role="alert">{error}</p>}

          <button className="btn" type="submit" disabled={busy || (mode === 'signup' && !captchaToken)}>
            {busy ? 'One moment...' : mode === 'signin' ? 'Sign in' : mode === 'forgot' ? 'Send reset link' : 'Create account'}
          </button>
        </form>
        )}

        {mode === "signin" && <button className="gurl-auth-switch" type="button" onClick={() => { setMode("forgot"); setError(""); }}>Forgot password?</button>}
        <button
          className="gurl-auth-switch"
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError('');
          }}
        >
          {mode === 'signin'
            ? 'New here? Create an account'
            : 'Already registered? Sign in'}
        </button>
      </div>
    </div>
  );
}
