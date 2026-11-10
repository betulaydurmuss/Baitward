// The training page a recipient lands on after clicking or submitting. Public (no
// auth): it reads the training content for the token, shows a short lesson and a
// quiz, and records completion. Teaches rather than shames.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';

type Content = {
  title: string;
  content: string;
  locale: 'tr' | 'en';
  quiz: { question: string; options: string[] }[];
};
type Result = { correct: number; total: number; passed: boolean };

export function TrainingScreen() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();

  const [content, setContent] = useState<Content | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<Content>(`/public/training/${token}`)
      .then((c) => {
        if (!active) return;
        setContent(c);
        setAnswers(new Array(c.quiz.length).fill(-1)); // -1 = unanswered
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [token]);

  if (error) return <p className="form-error">{t('auth.errors.generic')}</p>;
  if (!content) return <p className="muted">{t('common.loading')}</p>;

  async function submit() {
    setBusy(true);
    try {
      const r = await api.post<Result>(`/public/training/${token}/complete`, { answers });
      setResult(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div style={{ textAlign: 'center' }}>
        <ShieldCheck size={44} style={{ color: 'var(--accent)' }} aria-hidden="true" />
        <h1 style={{ marginTop: 'var(--space-2)' }}>{content.title}</h1>
      </div>
      <p className="muted">{content.content}</p>

      {result ? (
        <div className="card" style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
          <p style={{ color: result.passed ? 'var(--good)' : 'var(--text)', fontWeight: 600 }}>
            {t('training.score', { correct: result.correct, total: result.total })}
          </p>
          <p className="muted">{result.passed ? t('training.passed') : t('training.review')}</p>
        </div>
      ) : (
        <div style={{ marginTop: 'var(--space-4)' }}>
          {content.quiz.map((q, qi) => (
            <div key={qi} className="card" style={{ marginBottom: 'var(--space-3)' }}>
              <p style={{ fontWeight: 500, marginTop: 0 }}>{q.question}</p>
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}
                >
                  <input
                    type="radio"
                    name={`q${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ))}
          <button
            className="btn btn-primary"
            disabled={busy || answers.some((a) => a === -1)}
            onClick={submit}
          >
            {t('training.finish')}
          </button>
        </div>
      )}
    </div>
  );
}
