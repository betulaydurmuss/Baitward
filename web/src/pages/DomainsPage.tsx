import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';

type Domain = { id: string; domain: string; verifiedAt: string | null; txtRecord: string };
type DomainsResponse = { domains: Domain[]; devVerifyAvailable: boolean };

export function DomainsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);

  const data = useQuery({
    queryKey: ['domains'],
    queryFn: () => api.get<DomainsResponse>('/domains'),
  });

  const add = useMutation({
    mutationFn: (body: unknown) => api.post('/domains', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['domains'] });
      setDomain('');
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('auth.errors.generic')),
  });
  const verify = useMutation({
    mutationFn: ({ id, dev }: { id: string; dev: boolean }) =>
      api.post(`/domains/${id}/${dev ? 'dev-verify' : 'verify'}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domains'] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : t('auth.errors.generic')),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/domains/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domains'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    add.mutate({ domain });
  }

  return (
    <div>
      <div className="toolbar">
        <h1 className="page-title">{t('domains.title')}</h1>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        {t('domains.note')}
      </p>

      <form className="card card-form" onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="d-domain">{t('domains.domain')}</label>
          <input
            id="d-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            required
          />
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} disabled={add.isPending}>
          {t('domains.add')}
        </button>
      </form>

      {data.data?.domains.length === 0 && <p className="muted">{t('domains.empty')}</p>}
      {data.data?.domains.map((d) => (
        <div key={d.id} className="card" style={{ marginBottom: 'var(--space-3)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <strong>{d.domain}</strong>{' '}
              <span style={{ color: d.verifiedAt ? 'var(--good)' : 'var(--opened)', fontSize: 13 }}>
                {d.verifiedAt ? t('domains.verified') : t('domains.pending')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {!d.verifiedAt && (
                <button
                  className="btn btn-sm"
                  onClick={() => verify.mutate({ id: d.id, dev: false })}
                  disabled={verify.isPending}
                >
                  {t('domains.verify')}
                </button>
              )}
              {!d.verifiedAt && data.data?.devVerifyAvailable && (
                <button
                  className="btn btn-sm"
                  onClick={() => verify.mutate({ id: d.id, dev: true })}
                  disabled={verify.isPending}
                >
                  {t('domains.devVerify')}
                </button>
              )}
              <button className="btn btn-sm btn-danger" onClick={() => remove.mutate(d.id)}>
                {t('common.delete')}
              </button>
            </div>
          </div>
          {!d.verifiedAt && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                {t('domains.txtHint')}
              </div>
              <code
                style={{
                  display: 'block',
                  padding: 'var(--space-3)',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                }}
              >
                {d.txtRecord}
              </code>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
