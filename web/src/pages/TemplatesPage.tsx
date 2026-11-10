import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';

type Template = {
  id: string;
  name: string;
  locale: 'tr' | 'en';
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string | null;
};

const DEFAULT_HTML =
  '<p>Hi {{first_name}}, your parcel could not be delivered. {{tracking_link}}</p>';

export function TemplatesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [locale, setLocale] = useState<'tr' | 'en'>('tr');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const templates = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<{ templates: Template[] }>('/templates'),
  });

  const create = useMutation({
    mutationFn: (body: unknown) => api.post('/templates', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      setName('');
      setSubject('');
      setHtml(DEFAULT_HTML);
      setCategory('');
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('auth.errors.generic')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ name, locale, subject, html, difficulty, category: category || undefined });
  }

  return (
    <div>
      <div className="toolbar">
        <h1 className="page-title">{t('templates.title')}</h1>
      </div>

      <form className="card card-form" onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="row-2">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="tpl-name">{t('templates.name')}</label>
            <input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="tpl-locale">{t('templates.locale')}</label>
            <select
              id="tpl-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'tr' | 'en')}
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="tpl-subject">{t('templates.subject')}</label>
          <input
            id="tpl-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="tpl-html">{t('templates.html')}</label>
          <textarea id="tpl-html" value={html} onChange={(e) => setHtml(e.target.value)} required />
          <span className="muted" style={{ fontSize: 12 }}>
            {t('templates.vars')}
          </span>
        </div>
        <div className="row-2">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="tpl-diff">{t('templates.difficulty')}</label>
            <select
              id="tpl-diff"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            >
              <option value="easy">{t('templates.easy')}</option>
              <option value="medium">{t('templates.medium')}</option>
              <option value="hard">{t('templates.hard')}</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="tpl-cat">{t('templates.category')}</label>
            <input
              id="tpl-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="shipping"
            />
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} disabled={create.isPending}>
          {t('templates.add')}
        </button>
      </form>

      {templates.isLoading && <p className="muted">{t('common.loading')}</p>}
      {templates.data?.templates.length === 0 && <p className="muted">{t('templates.empty')}</p>}

      {!!templates.data?.templates.length && (
        <table className="table">
          <thead>
            <tr>
              <th>{t('templates.name')}</th>
              <th>{t('templates.locale')}</th>
              <th>{t('templates.subject')}</th>
              <th>{t('templates.difficulty')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {templates.data.templates.map((tpl) => (
              <tr key={tpl.id}>
                <td>{tpl.name}</td>
                <td>{tpl.locale.toUpperCase()}</td>
                <td className="muted">{tpl.subject}</td>
                <td>{t(`templates.${tpl.difficulty}`)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => remove.mutate(tpl.id)}>
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
