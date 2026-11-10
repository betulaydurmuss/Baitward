// The named queues the worker serves. Kept in one place so the API (which enqueues
// jobs) and the worker (which runs them) never drift apart.
export const QUEUE_NAMES = {
  // Gradual, scheduled delivery of simulated campaign emails.
  send: 'send',
  // Scheduled report generation and delivery.
  schedule: 'schedule',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
