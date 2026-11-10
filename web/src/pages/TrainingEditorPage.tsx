import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';

type Module = { id: string; title: string; locale: 'tr' | 'en' };
type Question = { question: string; options: string[]; answer: number };

const emptyQuestion = (): Question => ({ question: '', options: ['', ''], answer: 0 });

export function TrainingEditorPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [locale, setLocale] = useState<'tr' | 'en'>('tr');
  const [content, setContent] = useState('');
  const [quiz, setQuiz] = useState<Question[]>([emptyQuestion()]);
  const [error, setError] = useState<string | null>(null);

  const modules = useQuery({
    queryKey: ['training'],
    queryFn: () => api.get<{ modules: Module[] }>('/training'),
  });
  const create = useMutation({
    mutationFn: (body: unknown) => api.post('/training', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training'] });
      setTitle('');
      setContent('');
      setQuiz([emptyQuestion()]);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('auth.errors.generic')),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/training/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });

  const updateQuestion = (qi: number, patch: Partial<Question>) =>
    setQuiz((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ title, locale, content, quiz });
  }

  return (
    <div>
      <div className="toolbar">
        <h1 className="page-title">{t('trainingEditor.title')}</h1>
      </div>

      <form className="card card-form" onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="row-2">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="tr-title">{t('trainingEditor.name')}</label>
            <input
              id="tr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="tr-locale">{t('templates.locale')}</label>
            <select
              id="tr-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'tr' | 'en')}
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="tr-content">{t('trainingEditor.content')}</label>
          <textarea
            id="tr-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <strong style={{ fontSize: 14 }}>{t('trainingEditor.quiz')}</strong>
          {quiz.map((q, qi) => (
            <div key={qi} className="card" style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input
                  placeholder={t('trainingEditor.question')}
                  value={q.question}
                  onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                  style={{
                    flex: 1,
                    padding: 'var(--space-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  required
                />
                {quiz.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setQuiz((qs) => qs.filter((_, i) => i !== qi))}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <input
                    type="radio"
                    name={`ans-${qi}`}
                    checked={q.answer === oi}
                    onChange={() => updateQuestion(qi, { answer: oi })}
                  />
                  <input
                    placeholder={`${t('trainingEditor.option')} ${oi + 1}`}
                    value={opt}
                    onChange={(e) =>
                      updateQuestion(qi, {
                        options: q.options.map((o, i) => (i === oi ? e.target.value : o)),
                      })
                    }
                    style={{
                      flex: 1,
                      padding: 'var(--space-2)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    required
                  />
                </label>
              ))}
              {q.options.length < 4 && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ width: 'auto', justifySelf: 'start' }}
                  onClick={() => updateQuestion(qi, { options: [...q.options, ''] })}
                >
                  {t('trainingEditor.addOption')}
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm"
            style={{ width: 'auto', justifySelf: 'start' }}
            onClick={() => setQuiz((qs) => [...qs, emptyQuestion()])}
          >
            <Plus size={14} /> {t('trainingEditor.addQuestion')}
          </button>
        </div>

        <button className="btn btn-primary" style={{ width: 'auto' }} disabled={create.isPending}>
          {t('trainingEditor.add')}
        </button>
      </form>

      {modules.data?.modules.length === 0 && <p className="muted">{t('trainingEditor.empty')}</p>}
      {!!modules.data?.modules.length && (
        <table className="table">
          <thead>
            <tr>
              <th>{t('trainingEditor.name')}</th>
              <th>{t('templates.locale')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {modules.data.modules.map((m) => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.locale.toUpperCase()}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => remove.mutate(m.id)}>
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
