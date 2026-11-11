import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-3)', fontSize: 30, letterSpacing: '-0.02em' }}>
          {t('home.title')}
        </h1>
        <p className="muted" style={{ margin: 0, maxWidth: 640, fontSize: 17 }}>
          {t('home.lede')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <Link
          to="/signin"
          className="btn btn-primary"
          style={{ width: 'auto', textDecoration: 'none' }}
        >
          {t('nav.signIn')}
        </Link>
        <Link to="/signup" className="btn" style={{ textDecoration: 'none' }}>
          {t('auth.signIn.signUpLink')}
        </Link>
      </div>

      <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
        <h2 style={{ margin: '0 0 var(--space-2)', fontSize: 16 }}>{t('home.guaranteeTitle')}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {t('home.guarantee')}
        </p>
      </div>

      <p className="muted mono" style={{ fontSize: 13 }}>
        {t('home.status')}
      </p>
    </div>
  );
}
