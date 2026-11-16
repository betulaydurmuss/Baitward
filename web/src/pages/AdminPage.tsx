import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

type HealthData = {
  queue: Record<string, number>;
  last24h: { sends: number; events: number };
  campaignsSending: number;
  org: { monthlySendLimit: number; verifiedDomain: string | null; dataRetentionDays: number };
};
type AdminUser = {
  id: string;
  email: string;
  role: string;
  totpEnabled: boolean;
  suspendedAt: string | null;
};
type AuditRow = {
  id: string;
  action: string;
  target: string | null;
  ip: string | null;
  actor: string | null;
  createdAt: string;
};

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 120 }}>
      <div className="mono" style={{ fontSize: 24, fontWeight: 600 }}>
        {value}
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        {label}
      </div>
    </div>
  );
}

export function AdminPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();

  const health = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => api.get<HealthData>('/admin/system/health'),
    refetchInterval: 30_000,
  });
  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<{ users: AdminUser[] }>('/admin/users'),
  });
  const audit = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => api.get<{ logs: AuditRow[] }>('/admin/audit-logs'),
  });

  const suspend = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      api.post(`/admin/users/${id}/suspend`, { suspended }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-audit'] });
    },
  });
  const reset = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/reset-password`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-audit'] }),
  });

  // Organisation settings form, seeded from the health payload once it loads.
  const [retention, setRetention] = useState('');
  const [limit, setLimit] = useState('');
  useEffect(() => {
    if (health.data) {
      setRetention(String(health.data.org.dataRetentionDays));
      setLimit(String(health.data.org.monthlySendLimit));
    }
  }, [health.data]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      await api.post('/admin/retention', { dataRetentionDays: Number(retention) });
      await api.post('/admin/limit', { monthlySendLimit: Number(limit) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-health'] });
      qc.invalidateQueries({ queryKey: ['admin-audit'] });
    },
  });
  const onSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    saveSettings.mutate();
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString(i18n.resolvedLanguage);

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <h1 className="page-title">{t('admin.title')}</h1>

      <section>
        <h2 style={{ fontSize: 15, marginBottom: 'var(--space-4)' }}>{t('admin.health')}</h2>
        {health.data && (
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Stat label={t('admin.queueWaiting')} value={health.data.queue.waiting ?? 0} />
            <Stat label={t('admin.queueActive')} value={health.data.queue.active ?? 0} />
            <Stat label={t('admin.queueDelayed')} value={health.data.queue.delayed ?? 0} />
            <Stat label={t('admin.sends24h')} value={health.data.last24h.sends} />
            <Stat label={t('admin.events24h')} value={health.data.last24h.events} />
            <Stat label={t('admin.sending')} value={health.data.campaignsSending} />
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 15, marginBottom: 'var(--space-4)' }}>{t('admin.settings')}</h2>
        <form className="card card-form" onSubmit={onSaveSettings} style={{ maxWidth: 520 }}>
          <div className="row-2">
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="retention">{t('admin.retentionDays')}</label>
              <input
                id="retention"
                type="number"
                min={0}
                max={3650}
                value={retention}
                onChange={(e) => setRetention(e.target.value)}
              />
              <small className="muted">{t('admin.retentionHint')}</small>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="limit">{t('admin.monthlyLimit')}</label>
              <input
                id="limit"
                type="number"
                min={0}
                max={1000000}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
              <small className="muted">{t('admin.monthlyLimitHint')}</small>
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <button
              className="btn btn-primary"
              style={{ width: 'auto' }}
              disabled={saveSettings.isPending}
            >
              {saveSettings.isPending ? t('common.loading') : t('admin.saveSettings')}
            </button>
            {saveSettings.isSuccess && (
              <span className="muted" style={{ marginLeft: 12, color: 'var(--good)' }}>
                {t('admin.saved')}
              </span>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 style={{ fontSize: 15, marginBottom: 'var(--space-4)' }}>{t('admin.users')}</h2>
        <table className="table">
          <thead>
            <tr>
              <th>{t('targets.email')}</th>
              <th>{t('admin.role')}</th>
              <th>{t('admin.status')}</th>
              <th>2FA</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.data?.users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td className="muted">{u.role}</td>
                <td style={{ color: u.suspendedAt ? 'var(--bad)' : 'var(--good)' }}>
                  {u.suspendedAt ? t('admin.suspended') : t('admin.active')}
                </td>
                <td>{u.totpEnabled ? '✓' : '—'}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-sm"
                    style={{ marginRight: 8 }}
                    onClick={() => reset.mutate(u.id)}
                  >
                    {t('admin.resetLink')}
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => suspend.mutate({ id: u.id, suspended: !u.suspendedAt })}
                  >
                    {u.suspendedAt ? t('admin.activate') : t('admin.suspend')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ fontSize: 15, marginBottom: 'var(--space-4)' }}>{t('admin.auditLog')}</h2>
        {audit.data?.logs.length === 0 && <p className="muted">{t('admin.noLogs')}</p>}
        {!!audit.data?.logs.length && (
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.when')}</th>
                <th>{t('admin.action')}</th>
                <th>{t('admin.target')}</th>
                <th>{t('admin.actor')}</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {audit.data.logs.map((l) => (
                <tr key={l.id}>
                  <td className="muted mono" style={{ fontSize: 12 }}>
                    {fmt(l.createdAt)}
                  </td>
                  <td className="mono" style={{ fontSize: 13 }}>
                    {l.action}
                  </td>
                  <td className="muted">{l.target ?? '—'}</td>
                  <td className="muted">{l.actor ?? '—'}</td>
                  <td className="muted mono" style={{ fontSize: 12 }}>
                    {l.ip ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
