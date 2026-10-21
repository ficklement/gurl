import { useState } from 'react';
import { authClient } from '../auth-client.js';

export default function ResetPassword({ onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const params = new URLSearchParams(window.location.search);
  const resetError = params.get('error');
  const missingToken = !params.get('token');

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const token = new URLSearchParams(window.location.search).get('token');
      if (!token) throw new Error('Missing reset token.');

      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Reset failed.');
      }

      setMessage('Password updated! You can now sign in.');
      window.history.replaceState({}, '', '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gurl-auth-overlay">
      <div className="gurl-auth-dialog" role="dialog" aria-modal="true">
        <div className="eyebrow">KAISER'S PRIVATE JOURNAL</div>
        <h2>New password, gurl.</h2>

        {!message && (resetError || missingToken) ? (
          <>
            <p className="gurl-auth-error" role="alert">
              This password-reset link is invalid or has expired.
              Request a fresh link from the sign-in screen.
            </p>
            <button className="btn" type="button" onClick={onClose}>
              Back to sign in
            </button>
          </>
        ) : message ? (
          <>
            <p role="status">{message}</p>
            <button className="btn" onClick={onClose}>Continue</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <label>New password
              <input type="password" minLength={8} required
                autoComplete="new-password" value={password}
                onChange={e => setPassword(e.target.value)} />
            </label>

            <label>Confirm password
              <input type="password" minLength={8} required
                autoComplete="new-password" value={confirm}
                onChange={e => setConfirm(e.target.value)} />
            </label>

            {error && <p className="gurl-auth-error" role="alert">{error}</p>}

            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Updating...' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
