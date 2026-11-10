import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

type Session = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
};

export function SessionsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<{ sessions: Session[] }>('/auth/sessions'),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.del(`/auth/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const revokeAll = useMutation({
    mutationFn: () => api.post('/auth/sessions/revoke-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const fmt = (iso: string) => new Date(iso).toLocaleString(i18n.resolvedLanguage);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t('auth.sessions.title')}</h1>
        <button
          className="btn btn-danger"
          onClick={() => revokeAll.mutate()}
          disabled={revokeAll.isPending}
        >
          {t('auth.sessions.revokeAll')}
        </button>
      </div>

      {sessions.isLoading && <p className="muted">{t('common.loading')}</p>}
      {sessions.data?.sessions.length === 0 && <p className="muted">{t('auth.sessions.empty')}</p>}

      {sessions.data?.sessions.map((s) => (
        <div key={s.id} className="session-row">
          <div>
            <div style={{ fontWeight: 500 }}>
              {s.ip ?? '—'}{' '}
              {s.current && <span className="badge">{t('auth.sessions.current')}</span>}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {s.userAgent ?? '—'}
            </div>
            <div className="muted mono" style={{ fontSize: 12 }}>
              {fmt(s.lastUsedAt)}
            </div>
          </div>
          {!s.current && (
            <button
              className="btn btn-danger"
              onClick={() => revoke.mutate(s.id)}
              disabled={revoke.isPending}
            >
              {t('auth.sessions.revoke')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
