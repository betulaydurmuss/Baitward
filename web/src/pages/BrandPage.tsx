import { useTranslation } from 'react-i18next';
import { Logo } from '../brand/Logo';

// A single page gathering every brand element — logo variants, palette and type —
// so the identity is documented in one place (the /brand page from the brief).
const SWATCHES: { name: string; token: string }[] = [
  { name: 'accent', token: '--accent' },
  { name: 'bg', token: '--bg' },
  { name: 'surface', token: '--surface' },
  { name: 'line', token: '--line' },
  { name: 'text', token: '--text' },
  { name: 'muted', token: '--muted' },
  { name: 'opened', token: '--opened' },
  { name: 'clicked', token: '--clicked' },
  { name: 'submitted', token: '--bad' },
  { name: 'reported', token: '--good' },
];

export function BrandPage() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)' }}>{t('brand.title')}</h1>
        <p className="muted" style={{ margin: 0, maxWidth: 620 }}>
          {t('brand.intro')}
        </p>
      </div>

      <section style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{t('brand.logo')}</h2>
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div
            className="card"
            style={{ display: 'grid', gap: 'var(--space-3)', placeItems: 'center' }}
          >
            <Logo variant="full" size={40} />
            <span className="muted mono" style={{ fontSize: 12 }}>
              {t('brand.logoFull')}
            </span>
          </div>
          <div
            className="card"
            style={{
              display: 'grid',
              gap: 'var(--space-3)',
              placeItems: 'center',
              color: 'var(--accent)',
            }}
          >
            <Logo variant="icon" size={40} />
            <span className="muted mono" style={{ fontSize: 12 }}>
              {t('brand.logoIcon')}
            </span>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{t('brand.palette')}</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          {SWATCHES.map((s) => (
            <div key={s.token} className="card" style={{ padding: 'var(--space-3)' }}>
              <div
                style={{
                  height: 44,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  background: `var(${s.token})`,
                }}
              />
              <div style={{ marginTop: 'var(--space-2)' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                <code style={{ fontSize: 12, color: 'var(--muted)' }}>{s.token}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{t('brand.typography')}</h2>
        <div className="card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600 }}>
              The quick brown fox — Hızlı kahverengi tilki
            </div>
            <span className="muted" style={{ fontSize: 12 }}>
              {t('brand.sansLabel')}
            </span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20 }}>
              0123456789 · 42% · 09:45
            </div>
            <span className="muted" style={{ fontSize: 12 }}>
              {t('brand.monoLabel')}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
