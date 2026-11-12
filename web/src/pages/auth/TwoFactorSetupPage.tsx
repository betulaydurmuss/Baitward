import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../../lib/api';
import { useAuth, type AuthUser } from '../../auth/AuthContext';

type SetupResponse = { secret: string; otpauthUrl: string; qrDataUrl: string };
type EnableResponse = { backupCodes: string[]; accessToken?: string; user?: AuthUser };

export function TwoFactorSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { applySession } = useAuth();

  // Present when enrolling at sign-in; absent when an already signed-in user adds 2FA.
  const pendingToken = (location.state as { pendingToken?: string } | null)?.pendingToken ?? null;

  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.post<SetupResponse>(
          '/auth/2fa/setup',
          pendingToken ? { pendingToken } : undefined,
        );
        if (active) setSetup(res);
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : t('auth.errors.generic'));
      }
    })();
    return () => {
      active = false;
    };
  }, [pendingToken, t]);

  async function onEnable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<EnableResponse>('/auth/2fa/enable', {
        code,
        ...(pendingToken ? { pendingToken } : {}),
      });
      if (res.accessToken && res.user) {
        applySession({ accessToken: res.accessToken, user: res.user });
      }
      setBackupCodes(res.backupCodes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  if (backupCodes) {
    return (
      <div className="auth-wrap">
        <h1>{t('auth.twoFactor.backupTitle')}</h1>
        <p className="muted">{t('auth.twoFactor.backupIntro')}</p>
        <div className="backup-codes">
          {backupCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 'var(--space-4)' }}
          onClick={() => navigate('/dashboard')}
        >
          {t('auth.twoFactor.done')}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <h1>{t('auth.twoFactor.setupTitle')}</h1>
      {error && <p className="form-error">{error}</p>}
      {!setup ? (
        <p className="muted">{t('common.loading')}</p>
      ) : (
        <>
          <p className="muted">{t('auth.twoFactor.scan')}</p>
          <img
            src={setup.qrDataUrl}
            alt="TOTP QR code"
            width={180}
            height={180}
            style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}
          />
          <p className="muted" style={{ fontSize: 13 }}>
            {t('auth.twoFactor.manualKey')} <code>{setup.secret}</code>
          </p>
          <form onSubmit={onEnable}>
            <div className="field">
              <label htmlFor="code">{t('auth.twoFactor.enterCode')}</label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" disabled={busy}>
              {t('auth.twoFactor.enable')}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
