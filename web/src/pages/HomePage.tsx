import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Send,
  MousePointerClick,
  GraduationCap,
  BarChart3,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const FEATURES: { icon: LucideIcon; key: string }[] = [
  { icon: Send, key: 'campaigns' },
  { icon: MousePointerClick, key: 'tracking' },
  { icon: GraduationCap, key: 'training' },
  { icon: BarChart3, key: 'reports' },
  { icon: ShieldCheck, key: 'privacy' },
  { icon: Globe, key: 'bilingual' },
];

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div>
      <section className="hero">
        <span className="hero-eyebrow">
          <span className="dot" /> {t('home.eyebrow')}
        </span>
        <h1 className="hero-title">{t('home.title')}</h1>
        <p className="hero-lede">{t('home.lede')}</p>
        <div className="hero-cta">
          <Link to="/signup" className="btn btn-primary" style={{ width: 'auto' }}>
            {t('home.cta')}
          </Link>
        </div>
        <p className="muted" style={{ marginTop: 'var(--space-4)', fontSize: 14 }}>
          {t('home.haveAccount')} <Link to="/signin">{t('nav.signIn')}</Link>
        </p>
      </section>

      <h2 className="section-title">{t('home.featuresHeading')}</h2>
      <div className="feature-grid">
        {FEATURES.map(({ icon: Icon, key }) => (
          <div key={key} className="feature-card">
            <div className="feature-icon">
              <Icon size={20} aria-hidden="true" />
            </div>
            <h3>{t(`home.features.${key}.title`)}</h3>
            <p>{t(`home.features.${key}.desc`)}</p>
          </div>
        ))}
      </div>

      <div className="guarantee-banner">
        <h2 style={{ margin: '0 0 var(--space-2)', fontSize: 16 }}>{t('home.guaranteeTitle')}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {t('home.guarantee')}
        </p>
      </div>
    </div>
  );
}
