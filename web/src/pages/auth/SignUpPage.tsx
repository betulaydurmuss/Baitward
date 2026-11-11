import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../../lib/api';

export function SignUpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ enrollTwoFactor: true; pendingToken: string }>(
        '/auth/register',
        { orgName, email, password },
      );
      // A new admin must set up two-factor before the account is usable.
      navigate('/2fa-setup', { state: { pendingToken: res.pendingToken } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>{t('auth.signUp.title')}</h1>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="orgName">{t('auth.signUp.orgName')}</label>
          <input
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">{t('auth.signUp.email')}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">{t('auth.signUp.password')}</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {t('auth.signUp.submit')}
        </button>
      </form>
      <div className="auth-links">
        <span className="muted">{t('auth.signUp.haveAccount')}</span>
        <Link to="/signin">{t('auth.signUp.signInLink')}</Link>
      </div>
    </div>
  );
}
