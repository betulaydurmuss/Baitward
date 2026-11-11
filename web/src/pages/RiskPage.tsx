import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

type Band = 'low' | 'medium' | 'high';
type Scores = {
  byTarget: { targetId: string; email: string; department: string; score: number; band: Band }[];
  byDepartment: { department: string; score: number; band: Band; count: number }[];
};

const BAND_COLOR: Record<Band, string> = {
  low: 'var(--good)',
  medium: 'var(--clicked)',
  high: 'var(--bad)',
};

export function RiskPage() {
  const { t } = useTranslation();
  const scores = useQuery({
    queryKey: ['risk'],
    queryFn: () => api.get<Scores>('/risk/scores'),
    refetchInterval: 30_000,
  });

  if (scores.isLoading) return <p className="muted">{t('common.loading')}</p>;
  if (scores.isError || !scores.data)
    return <p className="form-error">{t('auth.errors.generic')}</p>;

  const { byTarget, byDepartment } = scores.data;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <div>
        <h1 className="page-title" style={{ marginBottom: 'var(--space-2)' }}>
          {t('risk.title')}
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          {t('risk.note')}
        </p>
      </div>

      <section>
        <h2 style={{ fontSize: 15, marginBottom: 'var(--space-4)' }}>{t('risk.heatmap')}</h2>
        {byDepartment.length === 0 ? (
          <p className="muted">{t('detail.noData')}</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {byDepartment.map((d) => (
              <div
                key={d.department}
                className="card"
                style={{ padding: 'var(--space-4)', borderLeft: `3px solid ${BAND_COLOR[d.band]}` }}
              >
                <div style={{ fontWeight: 600 }}>{d.department}</div>
                <div className="mono" style={{ fontSize: 26, color: BAND_COLOR[d.band] }}>
                  {d.score}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {t(`risk.bands.${d.band}`)} · {d.count} {t('risk.people')}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 15, marginBottom: 'var(--space-4)' }}>{t('risk.byEmployee')}</h2>
        {byTarget.length === 0 ? (
          <p className="muted">{t('detail.noData')}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t('targets.email')}</th>
                <th>{t('targets.department')}</th>
                <th>{t('risk.score')}</th>
                <th>{t('risk.band')}</th>
              </tr>
            </thead>
            <tbody>
              {byTarget.map((p) => (
                <tr key={p.targetId}>
                  <td>{p.email}</td>
                  <td className="muted">{p.department}</td>
                  <td className="mono" style={{ color: BAND_COLOR[p.band], fontWeight: 600 }}>
                    {p.score}
                  </td>
                  <td style={{ color: BAND_COLOR[p.band] }}>{t(`risk.bands.${p.band}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
