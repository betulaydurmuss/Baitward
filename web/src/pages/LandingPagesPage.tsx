import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';

type LandingPage = {
  id: string;
  name: string;
  locale: 'tr' | 'en';
  capturesSubmit: boolean;
  trainingId: string | null;
};
type TrainingModule = { id: string; title: string; locale: 'tr' | 'en' };

const DEFAULT_HTML = `<div style="max-width:360px;margin:48px auto;font-family:sans-serif">
  <h2>Sign in to continue</h2>
  <form method="post" action="{{submit_url}}">
    <p><input name="email" placeholder="Email" value="{{email}}" style="width:100%;padding:8px"></p>
    <p><input name="password" type="password" placeholder="Password" style="width:100%;padding:8px"></p>
    <button type="submit" style="padding:8px 16px">Sign in</button>
  </form>
</div>`;

// Fills placeholders with sample values just for the live preview.
function previewHtml(html: string): string {
  return html
    .replace(/\{\{\s*first_name\s*\}\}/g, 'Ayşe')
    .replace(/\{\{\s*company\s*\}\}/g, 'Demo Corp')
    .replace(/\{\{\s*email\s*\}\}/g, 'ayse@demo.example')
    .replace(/\{\{\s*submit_url\s*\}\}/g, '#')
    .replace(/\{\{\s*\w+\s*\}\}/g, '');
}

export function LandingPagesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [locale, setLocale] = useState<'tr' | 'en'>('tr');
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [capturesSubmit, setCapturesSubmit] = useState(true);
  const [trainingId, setTrainingId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pages = useQuery({
    queryKey: ['landing-pages'],
    queryFn: () => api.get<{ landingPages: LandingPage[] }>('/landing-pages'),
  });
  const modules = useQuery({
    queryKey: ['training'],
    queryFn: () => api.get<{ modules: TrainingModule[] }>('/training'),
  });

  const create = useMutation({
    mutationFn: (body: unknown) => api.post('/landing-pages', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing-pages'] });
      setName('');
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('auth.errors.generic')),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/landing-pages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['landing-pages'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ name, locale, html, capturesSubmit, trainingId: trainingId || null });
  }

  return (
    <div>
      <div className="toolbar">
        <h1 className="page-title">{t('landing.title')}</h1>
      </div>

      <form className="card card-form" onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="row-2">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="l-name">{t('landing.name')}</label>
            <input id="l-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="l-locale">{t('templates.locale')}</label>
            <select
              id="l-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'tr' | 'en')}
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>

        <div className="row-2">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="l-html">{t('landing.html')}</label>
            <textarea
              id="l-html"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              style={{ minHeight: 220 }}
              required
            />
            <span className="muted" style={{ fontSize: 12 }}>
              {t('landing.formHint')}
            </span>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{t('landing.preview')}</label>
            <iframe
              title="preview"
              srcDoc={previewHtml(html)}
              style={{
                width: '100%',
                minHeight: 220,
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                background: '#fff',
              }}
            />
          </div>
        </div>

        <div className="row-2">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="l-training">{t('landing.training')}</label>
            <select
              id="l-training"
              value={trainingId}
              onChange={(e) => setTrainingId(e.target.value)}
            >
              <option value="">{t('landing.defaultTraining')}</option>
              {modules.data?.modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.locale.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 24 }}
          >
            <input
              type="checkbox"
              checked={capturesSubmit}
              onChange={(e) => setCapturesSubmit(e.target.checked)}
            />
            {t('landing.capturesSubmit')}
          </label>
        </div>

        <button className="btn btn-primary" style={{ width: 'auto' }} disabled={create.isPending}>
          {t('landing.add')}
        </button>
      </form>

      {pages.data?.landingPages.length === 0 && <p className="muted">{t('landing.empty')}</p>}
      {!!pages.data?.landingPages.length && (
        <table className="table">
          <thead>
            <tr>
              <th>{t('landing.name')}</th>
              <th>{t('templates.locale')}</th>
              <th>{t('landing.capturesSubmit')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pages.data.landingPages.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.locale.toUpperCase()}</td>
                <td>{p.capturesSubmit ? '✓' : '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => remove.mutate(p.id)}>
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
