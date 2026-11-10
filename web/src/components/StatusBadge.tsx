// Shows a campaign-journey status as an icon + coloured text. Status is never
// conveyed by colour alone (an icon and a label always travel with it), so the
// meaning survives colour-blindness and greyscale printing.
import { Send, MailOpen, MousePointerClick, ShieldAlert, Flag, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type EventStatus = 'sent' | 'opened' | 'clicked' | 'submitted' | 'reported' | 'trained';

const META: Record<EventStatus, { color: string; Icon: LucideIcon }> = {
  sent: { color: 'var(--sent)', Icon: Send },
  opened: { color: 'var(--opened)', Icon: MailOpen },
  clicked: { color: 'var(--clicked)', Icon: MousePointerClick },
  submitted: { color: 'var(--bad)', Icon: ShieldAlert },
  reported: { color: 'var(--good)', Icon: Flag },
  trained: { color: 'var(--good)', Icon: GraduationCap },
};

export function StatusBadge({ status }: { status: EventStatus }) {
  const { t } = useTranslation();
  const { color, Icon } = META[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color }}>
      <Icon size={15} aria-hidden="true" />
      <span style={{ fontWeight: 500 }}>{t(`status.${status}`)}</span>
    </span>
  );
}

export const STATUS_COLOR: Record<EventStatus, string> = {
  sent: META.sent.color,
  opened: META.opened.color,
  clicked: META.clicked.color,
  submitted: META.submitted.color,
  reported: META.reported.color,
  trained: META.trained.color,
};
