// The awareness page a recipient lands on after clicking (or submitting to) a
// simulated phishing link. It is public and teaches rather than shames. The full
// interactive training with a quiz arrives in Phase 4.
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';

export function CaughtPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const reported = params.get('reported') === '1';

  const tips = t('caught.tips', { returnObjects: true }) as string[];

  return (
    <div className="auth-wrap" style={{ textAlign: 'center' }}>
      <ShieldCheck
        size={48}
        style={{ color: reported ? 'var(--good)' : 'var(--accent)' }}
        aria-hidden="true"
      />
      <h1 style={{ marginTop: 'var(--space-3)' }}>
        {reported ? t('caught.reportedTitle') : t('caught.title')}
      </h1>
      <p className="muted">{reported ? t('caught.reportedBody') : t('caught.body')}</p>

      <ul
        style={{
          textAlign: 'left',
          marginTop: 'var(--space-4)',
          color: 'var(--muted)',
          lineHeight: 1.8,
        }}
      >
        {Array.isArray(tips) && tips.map((tip) => <li key={tip}>{tip}</li>)}
      </ul>
    </div>
  );
}
