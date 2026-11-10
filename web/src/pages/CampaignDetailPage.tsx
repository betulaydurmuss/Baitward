import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Funnel, type FunnelData } from '../components/Funnel';

type Stats = {
  campaign: { id: string; status: string; template: { name: string; locale: string } | null };
  funnel: FunnelData;
  byDepartment: {
    department: string;
    total: number;
    sent: number;
    clicked: number;
    submitted: number;
  }[];
};

export function CampaignDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const stats = useQuery({
    queryKey: ['campaign-stats', id],
    queryFn: () => api.get<Stats>(`/campaigns/${id}/stats`),
    refetchInterval: 30_000,
  });

  if (stats.isLoading) return <p className="muted">{t('common.loading')}</p>;
  if (stats.isError || !stats.data) return <p className="form-error">{t('auth.errors.generic')}</p>;

  const { campaign, funnel, byDepartment } = stats.data;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <div>
        <Link to="/campaigns" className="muted" style={{ fontSize: 13 }}>
          ← {t('nav.campaigns')}
        </Link>
        <h1 className="page-title" style={{ marginTop: 'var(--space-2)' }}>
          {campaign.template?.name ?? '—'}
        </h1>
        <span className="muted">{t(`campaigns.statuses.${campaign.status}`)}</span>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginTop: 0, marginBottom: 'var(--space-4)' }}>
          {t('detail.funnel')}
        </h2>
        <Funnel data={funnel} />
      </div>

      <div>
        <h2 style={{ fontSize: 15, marginBottom: 'var(--space-4)' }}>{t('detail.byDepartment')}</h2>
        {byDepartment.length === 0 ? (
          <p className="muted">{t('detail.noData')}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t('targets.department')}</th>
                <th>{t('status.sent')}</th>
                <th>{t('status.clicked')}</th>
                <th>{t('status.submitted')}</th>
              </tr>
            </thead>
            <tbody>
              {byDepartment.map((d) => (
                <tr key={d.department}>
                  <td>{d.department}</td>
                  <td className="mono">{d.sent}</td>
                  <td className="mono" style={{ color: d.clicked ? 'var(--clicked)' : undefined }}>
                    {d.clicked}
                  </td>
                  <td className="mono" style={{ color: d.submitted ? 'var(--bad)' : undefined }}>
                    {d.submitted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
