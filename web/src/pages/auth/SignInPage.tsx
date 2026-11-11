import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../../lib/api';
import { useAuth, type AuthUser } from '../../auth/AuthContext';

type LoginResponse =
  | { accessToken: string; user: AuthUser }
  | { twoFactorRequired: true; pendingToken: string }
  | { enrollTwoFactor: true; pendingToken: string };

export function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { applySession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingToken, setPendingToken] = useState<string | null>(null); // 2FA step
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      if ('accessToken' in res) {
        applySession(res);
        navigate('/');
      } else if ('twoFactorRequired' in res) {
        setPendingToken(res.pendingToken);
      } else {
        // Admin without 2FA: must enrol before entering.
        navigate('/2fa-setup', { state: { pendingToken: res.pendingToken } });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  async function onCodeSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ accessToken: string; user: AuthUser }>('/auth/2fa/verify', {
        pendingToken,
        code,
      });
      applySession(res);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  if (pendingToken) {
    return (
      <div className="auth-card">
        <h1>{t('auth.signIn.twoFactorTitle')}</h1>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={onCodeSubmit}>
          <div className="field">
            <label htmlFor="code">{t('auth.signIn.code')}</label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button className="btn btn-primary" disabled={busy}>
            {t('auth.signIn.verify')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1>{t('auth.signIn.title')}</h1>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={onPasswordSubmit}>
        <div className="field">
          <label htmlFor="email">{t('auth.signIn.email')}</label>
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
          <label htmlFor="password">{t('auth.signIn.password')}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {t('auth.signIn.submit')}
        </button>
      </form>
      <div className="auth-links">
        <Link to="/forgot-password">{t('auth.signIn.forgot')}</Link>
        <Link to="/signup">{t('auth.signIn.signUpLink')}</Link>
      </div>
    </div>
  );
}
