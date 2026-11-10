// The living design system: tokens, type, controls, status language and the four
// screen states, all on one page so the visual language stays consistent.
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from '../brand/Logo';
import { StatusBadge, type EventStatus } from '../components/StatusBadge';

const COLOR_TOKENS = [
  '--accent',
  '--bg',
  '--surface',
  '--line',
  '--text',
  '--muted',
  '--opened',
  '--clicked',
  '--bad',
  '--good',
];

const STATUSES: EventStatus[] = ['sent', 'opened', 'clicked', 'submitted', 'reported', 'trained'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <h2 style={{ fontSize: 15, margin: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

export function StyleguidePage() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="page-title">{t('styleguide.title')}</h1>
        <Logo variant="full" size={32} />
      </div>

      <Section title={t('styleguide.colors')}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          {COLOR_TOKENS.map((token) => (
            <div key={token} className="card" style={{ padding: 'var(--space-3)' }}>
              <div
                style={{
                  height: 40,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  background: `var(${token})`,
                }}
              />
              <code style={{ fontSize: 12, color: 'var(--muted)' }}>{token}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t('styleguide.typography')}>
        <div className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>
            Inter — The quick brown fox · Hızlı tilki
          </div>
          <div className="mono" style={{ fontSize: 18 }}>
            JetBrains Mono — 0123456789 · 42%
          </div>
        </div>
      </Section>

      <Section title={t('styleguide.controls')}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ width: 'auto' }}>
            Primary
          </button>
          <button className="btn">Secondary</button>
          <button className="btn btn-danger">Danger</button>
        </div>
      </Section>

      <Section title={t('styleguide.statuses')}>
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title={t('styleguide.states')}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <div className="card" style={{ height: 60, opacity: 0.5 }} aria-label="loading" />
          <div className="card muted" style={{ display: 'grid', placeItems: 'center' }}>
            {t('styleguide.emptyExample')}
          </div>
          <div className="card">
            <span className="form-error" style={{ margin: 0 }}>
              {t('auth.errors.generic')}
            </span>
          </div>
          <div className="card">
            <strong>42</strong> <span className="muted">items</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
