import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Send,
  MousePointerClick,
  GraduationCap,
  BarChart3,
  ShieldCheck,
  Globe,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Reveal } from '../components/Reveal';

const FEATURES: { icon: LucideIcon; key: string }[] = [
  { icon: Send, key: 'campaigns' },
  { icon: MousePointerClick, key: 'tracking' },
  { icon: GraduationCap, key: 'training' },
  { icon: BarChart3, key: 'reports' },
  { icon: ShieldCheck, key: 'privacy' },
  { icon: Globe, key: 'bilingual' },
];

// Illustrative sample funnel for the hero preview card (not real data).
const FUNNEL: { key: string; pct: number; tone: string }[] = [
  { key: 'sent', pct: 100, tone: 'var(--sent)' },
  { key: 'opened', pct: 68, tone: 'var(--opened)' },
  { key: 'clicked', pct: 32, tone: 'var(--clicked)' },
  { key: 'reported', pct: 21, tone: 'var(--good)' },
];

const STATS = ['bilingual', 'privacy', 'security', 'audit'];
const STEPS = ['setup', 'launch', 'train'];

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="landing">
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <span className="dot" /> {t('home.eyebrow')}
            </span>
            <h1 className="hero-title">{t('home.title')}</h1>
            <p className="hero-lede">{t('home.lede')}</p>
            <div className="hero-cta">
              <Link to="/signup" className="btn btn-primary" style={{ width: 'auto' }}>
                {t('home.cta')} <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <p className="muted hero-sub" style={{ marginTop: 'var(--space-4)', fontSize: 14 }}>
              {t('home.haveAccount')} <Link to="/signin">{t('nav.signIn')}</Link>
            </p>
          </div>

          <div className="hero-visual">
            <div className="preview-card">
              <div className="preview-head">
                <span className="preview-title">{t('home.preview.title')}</span>
                <span className="preview-tag">{t('home.preview.tag')}</span>
              </div>
              <div className="funnel">
                {FUNNEL.map(({ key, pct, tone }, i) => (
                  <div key={key} className="funnel-row">
                    <span className="funnel-label">{t(`status.${key}`)}</span>
                    <span className="funnel-track">
                      <span
                        className="funnel-bar"
                        style={
                          {
                            '--w': `${pct}%`,
                            '--d': `${0.3 + i * 0.15}s`,
                            background: tone,
                          } as CSSProperties
                        }
                      />
                    </span>
                    <span className="funnel-pct">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Honest stat strip ---------- */}
      <Reveal>
        <div className="stat-strip">
          {STATS.map((k) => (
            <div key={k} className="stat-cell">
              <span className="stat-value">{t(`home.stats.${k}.v`)}</span>
              <span className="stat-label">{t(`home.stats.${k}.l`)}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ---------- How it works ---------- */}
      <Reveal>
        <h2 className="section-title">{t('home.how.title')}</h2>
      </Reveal>
      <div className="step-grid">
        {STEPS.map((k, i) => (
          <Reveal key={k} delay={i * 90}>
            <div className="step-card">
              <span className="step-num">{i + 1}</span>
              <h3>{t(`home.how.steps.${k}.title`)}</h3>
              <p>{t(`home.how.steps.${k}.desc`)}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ---------- Features ---------- */}
      <Reveal>
        <h2 className="section-title">{t('home.featuresHeading')}</h2>
      </Reveal>
      <div className="feature-grid">
        {FEATURES.map(({ icon: Icon, key }, i) => (
          <Reveal key={key} delay={i * 60}>
            <div className="feature-card">
              <div className="feature-icon">
                <Icon size={20} aria-hidden="true" />
              </div>
              <h3>{t(`home.features.${key}.title`)}</h3>
              <p>{t(`home.features.${key}.desc`)}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ---------- Closing CTA ---------- */}
      <Reveal>
        <div className="cta-band">
          <h2>{t('home.cta2.title')}</h2>
          <p>{t('home.cta2.desc')}</p>
          <Link to="/signup" className="btn btn-primary" style={{ width: 'auto' }}>
            {t('home.cta')} <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </Reveal>

      <Reveal>
        <div className="guarantee-banner">
          <h2 style={{ margin: '0 0 var(--space-2)', fontSize: 16 }}>{t('home.guaranteeTitle')}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {t('home.guarantee')}
          </p>
        </div>
      </Reveal>
    </div>
  );
}
