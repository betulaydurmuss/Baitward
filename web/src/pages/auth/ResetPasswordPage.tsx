import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../../lib/api';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <h1>{t('auth.reset.title')}</h1>
      {done ? (
        <>
          <p className="form-note">{t('auth.reset.done')}</p>
          <Link to="/signin">{t('auth.forgot.back')}</Link>
        </>
      ) : (
        <>
          {error && <p className="form-error">{error}</p>}
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="newPassword">{t('auth.reset.newPassword')}</label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" disabled={busy || !token}>
              {t('auth.reset.submit')}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
