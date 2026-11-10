import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';

type CampaignRow = {
  id: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  dripPerMin: number;
  scheduledAt: string | null;
  template: { name: string; locale: 'tr' | 'en' } | null;
  _count: { targets: number };
};
type Template = { id: string; name: string; locale: 'tr' | 'en' };
type Target = { id: string; groups: string[] };

const STATUS_COLOR: Record<CampaignRow['status'], string> = {
  draft: 'var(--muted)',
  scheduled: 'var(--opened)',
  sending: 'var(--clicked)',
  completed: 'var(--good)',
  cancelled: 'var(--bad)',
};

export function CampaignsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [templateId, setTemplateId] = useState('');
  const [audience, setAudience] = useState('all');
  const [dripPerMin, setDripPerMin] = useState(20);
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const campaigns = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get<{ campaigns: CampaignRow[] }>('/campaigns'),
  });
  const templates = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<{ templates: Template[] }>('/templates'),
  });
  const targets = useQuery({
    queryKey: ['targets'],
    queryFn: () => api.get<{ targets: Target[] }>('/targets'),
  });

  const groups = useMemo(() => {
    const set = new Set<string>();
    targets.data?.targets.forEach((tg) => tg.groups.forEach((g) => set.add(g)));
    return [...set];
  }, [targets.data]);

  const create = useMutation({
    mutationFn: (body: unknown) => api.post('/campaigns', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('auth.errors.generic')),
  });

  const launch = useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/launch`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : t('auth.errors.generic')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = { templateId, dripPerMin };
    if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString();
    if (audience === 'all') {
      body.targetIds = targets.data?.targets.map((tg) => tg.id) ?? [];
    } else {
      body.groups = [audience];
    }
    create.mutate(body);
  }

  return (
    <div>
      <div className="toolbar">
        <h1 className="page-title">{t('campaigns.title')}</h1>
      </div>

      <form className="card card-form" onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="row-2">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="c-template">{t('campaigns.template')}</label>
            <select
              id="c-template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              required
            >
              <option value="" disabled>
                {t('campaigns.choose')}
              </option>
              {templates.data?.templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.locale.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="c-audience">{t('campaigns.audience')}</label>
            <select id="c-audience" value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="all">{t('campaigns.allTargets')}</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {t('campaigns.group')}: {g}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="c-drip">{t('campaigns.dripPerMin')}</label>
            <input
              id="c-drip"
              type="number"
              min={1}
              max={600}
              value={dripPerMin}
              onChange={(e) => setDripPerMin(Number(e.target.value))}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="c-sched">{t('campaigns.scheduledAt')}</label>
            <input
              id="c-sched"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: 'auto' }}
          disabled={create.isPending || !templateId}
        >
          {t('campaigns.create')}
        </button>
      </form>

      {campaigns.isLoading && <p className="muted">{t('common.loading')}</p>}
      {campaigns.data?.campaigns.length === 0 && <p className="muted">{t('campaigns.empty')}</p>}

      {!!campaigns.data?.campaigns.length && (
        <table className="table">
          <thead>
            <tr>
              <th>{t('campaigns.template')}</th>
              <th>{t('campaigns.recipients')}</th>
              <th>{t('campaigns.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {campaigns.data.campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.template?.name ?? '—'}</td>
                <td>{c._count.targets}</td>
                <td>
                  <span
                    className="status-pill"
                    style={{ color: STATUS_COLOR[c.status], borderColor: STATUS_COLOR[c.status] }}
                  >
                    {t(`campaigns.statuses.${c.status}`)}
                  </span>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {(c.status === 'draft' || c.status === 'scheduled') && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: 'auto', marginRight: 8 }}
                      onClick={() => launch.mutate(c.id)}
                    >
                      {t('campaigns.launch')}
                    </button>
                  )}
                  {c.status !== 'sending' && (
                    <button className="btn btn-danger btn-sm" onClick={() => remove.mutate(c.id)}>
                      {t('common.delete')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
