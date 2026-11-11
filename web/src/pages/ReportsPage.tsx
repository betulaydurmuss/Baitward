import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { api, ApiError } from '../lib/api';

type Report = {
  id: string;
  locale: 'tr' | 'en';
  generatedAt: string;
  campaign: { template: { name: string } | null } | null;
};
type Campaign = { id: string; template: { name: string } | null };

export function ReportsPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();

  const [campaignId, setCampaignId] = useState('');
  const [locale, setLocale] = useState<'tr' | 'en'>('tr');
  const [error, setError] = useState<string | null>(null);

  const reports = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get<{ reports: Report[] }>('/reports'),
  });
  const campaigns = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get<{ campaigns: Campaign[] }>('/campaigns'),
  });

  const generate = useMutation({
    mutationFn: (body: unknown) => api.post('/reports', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('auth.errors.generic')),
  });

  async function download(id: string) {
    const blob = await api.blob(`/reports/${id}/pdf`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baitward-report-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    generate.mutate({ campaignId, locale });
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString(i18n.resolvedLanguage);

  return (
    <div>
      <div className="toolbar">
        <h1 className="page-title">{t('reports.title')}</h1>
      </div>

      <form className="card card-form" onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="row-2">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="r-campaign">{t('campaigns.template')}</label>
            <select
              id="r-campaign"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              required
            >
              <option value="" disabled>
                {t('campaigns.choose')}
              </option>
              {campaigns.data?.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.template?.name ?? '—'}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="r-locale">{t('templates.locale')}</label>
            <select
              id="r-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'tr' | 'en')}
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: 'auto' }}
          disabled={generate.isPending || !campaignId}
        >
          {generate.isPending ? t('reports.generating') : t('reports.generate')}
        </button>
      </form>

      {reports.data?.reports.length === 0 && <p className="muted">{t('reports.empty')}</p>}
      {!!reports.data?.reports.length && (
        <table className="table">
          <thead>
            <tr>
              <th>{t('campaigns.template')}</th>
              <th>{t('templates.locale')}</th>
              <th>{t('reports.generated')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reports.data.reports.map((r) => (
              <tr key={r.id}>
                <td>{r.campaign?.template?.name ?? '—'}</td>
                <td>{r.locale.toUpperCase()}</td>
                <td className="muted mono" style={{ fontSize: 12 }}>
                  {fmt(r.generatedAt)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm" onClick={() => download(r.id)}>
                    <Download size={14} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
