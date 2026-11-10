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
