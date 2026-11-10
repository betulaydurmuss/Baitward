import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';

type Target = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  department: string | null;
  locale: 'tr' | 'en';
  groups: string[];
};

export function TargetsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [department, setDepartment] = useState('');
  const [groups, setGroups] = useState('');
  const [error, setError] = useState<string | null>(null);

  const targets = useQuery({
    queryKey: ['targets'],
    queryFn: () => api.get<{ targets: Target[] }>('/targets'),
  });

  const create = useMutation({
    mutationFn: (body: unknown) => api.post('/targets', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['targets'] });
      setEmail('');
      setFirstName('');
      setDepartment('');
      setGroups('');
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('auth.errors.generic')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/targets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['targets'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate({
      email,
      firstName: firstName || undefined,
      department: department || undefined,
      groups: groups
        ? groups
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean)
        : undefined,
    });
  }

  return (
    <div>
      <div className="toolbar">
        <h1 className="page-title">{t('targets.title')}</h1>
      </div>

      <form className="card card-form" onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="row-2">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="t-email">{t('targets.email')}</label>
            <input
              id="t-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="t-name">{t('targets.firstName')}</label>
            <input id="t-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="t-dep">{t('targets.department')}</label>
            <input id="t-dep" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="t-groups">{t('targets.groups')}</label>
            <input
              id="t-groups"
              value={groups}
              onChange={(e) => setGroups(e.target.value)}
              placeholder="finance, it"
            />
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} disabled={create.isPending}>
          {t('targets.add')}
        </button>
      </form>

      {targets.isLoading && <p className="muted">{t('common.loading')}</p>}
      {targets.data?.targets.length === 0 && <p className="muted">{t('targets.empty')}</p>}

      {!!targets.data?.targets.length && (
        <table className="table">
          <thead>
            <tr>
              <th>{t('targets.email')}</th>
              <th>{t('targets.firstName')}</th>
              <th>{t('targets.department')}</th>
              <th>{t('targets.groups')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {targets.data.targets.map((tg) => (
              <tr key={tg.id}>
                <td>{tg.email}</td>
                <td>{tg.firstName ?? '—'}</td>
                <td>{tg.department ?? '—'}</td>
                <td className="muted">{tg.groups.join(', ') || '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => remove.mutate(tg.id)}>
                    {t('common.delete')}
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
