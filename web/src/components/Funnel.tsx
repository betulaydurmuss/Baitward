// A compact campaign funnel: one row per stage with its status badge, count, a
// proportional bar and the share of recipients. Reported/trained are shown apart as
// the positive outcomes.
import { useTranslation } from 'react-i18next';
import { StatusBadge, STATUS_COLOR, type EventStatus } from './StatusBadge';

export type FunnelData = {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  submitted: number;
  reported: number;
  trained: number;
};

const STAGES: EventStatus[] = ['sent', 'opened', 'clicked', 'submitted'];

function Row({ status, count, total }: { status: EventStatus; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '150px 1fr 70px',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <StatusBadge status={status} />
      <div
        style={{ height: 8, background: 'var(--surface)', borderRadius: 999, overflow: 'hidden' }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: STATUS_COLOR[status] }} />
      </div>
      <div className="mono" style={{ fontSize: 13, textAlign: 'right' }}>
        {count} · {pct}%
      </div>
    </div>
  );
}

export function Funnel({ data }: { data: FunnelData }) {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      {STAGES.map((s) => (
        <Row key={s} status={s} count={data[s]} total={data.total} />
      ))}
      <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-2)' }}>
        <span className="muted" style={{ fontSize: 13 }}>
          {t('status.reported')}: <strong style={{ color: 'var(--good)' }}>{data.reported}</strong>
        </span>
        <span className="muted" style={{ fontSize: 13 }}>
          {t('status.trained')}: <strong style={{ color: 'var(--good)' }}>{data.trained}</strong>
        </span>
      </div>
    </div>
  );
}
