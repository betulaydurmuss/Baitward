import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Funnel, type FunnelData } from '../components/Funnel';

type Overview = {
  counts: { campaigns: number; targets: number; templates: number };
  recentCampaigns: { id: string; templateName: string; status: string; funnel: FunnelData }[];
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="mono" style={{ fontSize: 28, fontWeight: 600 }}>
        {value}
      </div>
      <div className="muted" style={{ fontSize: 13 }}>
        {label}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const overview = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<Overview>('/dashboard'),
    // Live counters: refresh in the background every 30 seconds.
    refetchInterval: 30_000,
  });

  if (overview.isLoading) {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="card" style={{ flex: 1, height: 72, opacity: 0.5 }} />
        ))}
      </div>
    );
  }

  if (overview.isError || !overview.data) {
    return <p className="form-error">{t('auth.errors.generic')}</p>;
  }

  const { counts, recentCampaigns } = overview.data;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <div>
        <h1 className="page-title" style={{ marginBottom: 'var(--space-4)' }}>
          {t('dashboard.title')}
        </h1>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <Stat label={t('nav.campaigns')} value={counts.campaigns} />
          <Stat label={t('nav.targets')} value={counts.targets} />
          <Stat label={t('nav.templates')} value={counts.templates} />
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 16, marginBottom: 'var(--space-4)' }}>{t('dashboard.recent')}</h2>
        {recentCampaigns.length === 0 ? (
          <p className="muted">{t('campaigns.empty')}</p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {recentCampaigns.map((c) => (
              <Link
                key={c.id}
                to={`/campaigns/${c.id}`}
                className="card"
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <strong>{c.templateName}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {t(`campaigns.statuses.${c.status}`)}
                  </span>
                </div>
                <Funnel data={c.funnel} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
