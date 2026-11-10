import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } finally {
      // The response is always the same, so we never reveal whether the email exists.
      setSent(true);
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <h1>{t('auth.forgot.title')}</h1>
      {sent ? (
        <p className="form-note">{t('auth.forgot.sent')}</p>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">{t('auth.forgot.email')}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" disabled={busy}>
            {t('auth.forgot.submit')}
          </button>
        </form>
      )}
      <div className="auth-links">
        <Link to="/signin">{t('auth.forgot.back')}</Link>
      </div>
    </div>
  );
}
