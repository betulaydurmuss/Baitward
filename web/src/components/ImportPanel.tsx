// Two-step CSV import for targets: paste or upload a file, preview which rows are
// valid (and why the rest are not), then commit. The sample is generated locally so
// it needs no authenticated download.
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

type ImportRow =
  | { line: number; valid: true; data: { email: string } }
  | { line: number; valid: false; reason: string };
type Preview = { rows: ImportRow[]; validCount: number };
type CommitResult = { created: number; skipped: number; invalid: number };

const SAMPLE = [
  'email,firstName,lastName,department,locale,groups',
  'ayse@demo.example,Ayşe,Yılmaz,Finance,tr,finance;all',
  'john@demo.example,John,Carter,Sales,en,sales;all',
].join('\n');

export function ImportPanel() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function doPreview() {
    setBusy(true);
    setResult(null);
    try {
      setPreview(await api.post<Preview>('/targets/import/preview', { csv }));
    } finally {
      setBusy(false);
    }
  }

  async function doCommit() {
    setBusy(true);
    try {
      const r = await api.post<CommitResult>('/targets/import/commit', { csv });
      setResult(r);
      setPreview(null);
      setCsv('');
      qc.invalidateQueries({ queryKey: ['targets'] });
    } finally {
      setBusy(false);
    }
  }

  function downloadSample() {
    const url = URL.createObjectURL(new Blob([SAMPLE], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'targets-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <details className="card" style={{ marginBottom: 'var(--space-6)' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 500 }}>{t('import.title')}</summary>
      <div style={{ marginTop: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) file.text().then(setCsv);
            }}
          />
          <button type="button" className="btn btn-sm" onClick={downloadSample}>
            {t('import.sample')}
          </button>
        </div>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={SAMPLE}
          style={{ minHeight: 100 }}
        />
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button type="button" className="btn" onClick={doPreview} disabled={busy || !csv.trim()}>
            {t('import.preview')}
          </button>
          {preview && preview.validCount > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: 'auto' }}
              onClick={doCommit}
              disabled={busy}
            >
              {t('import.commit', { n: preview.validCount })}
            </button>
          )}
        </div>

        {result && (
          <p className="form-note">
            {t('import.done', {
              created: result.created,
              skipped: result.skipped,
              invalid: result.invalid,
            })}
          </p>
        )}

        {preview && (
          <table className="table">
            <thead>
              <tr>
                <th>{t('import.line')}</th>
                <th>{t('import.status')}</th>
                <th>{t('import.detail')}</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r) => (
                <tr key={r.line}>
                  <td className="mono">{r.line}</td>
                  <td style={{ color: r.valid ? 'var(--good)' : 'var(--bad)' }}>
                    {r.valid ? t('import.valid') : t('import.invalid')}
                  </td>
                  <td className="muted">{r.valid ? r.data.email : r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </details>
  );
}
