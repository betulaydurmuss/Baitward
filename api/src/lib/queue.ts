// The producer side of the send queue. The API enqueues one job per recipient when
// a campaign launches; the worker consumes them. The queue name must match
// worker/src/queues.ts.
//
// Construction is lazy so that merely importing this module (e.g. in a test that
// never launches a campaign) does not open a Redis connection.
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../env.js';

export const SEND_QUEUE = 'send';
export const PREVIEW_QUEUE = 'preview';

export type SendJob = { campaignTargetId: string };
export type PreviewJob = { templateId: string; orgId: string; toEmail: string };

let queue: Queue<SendJob> | null = null;
let previewQueue: Queue<PreviewJob> | null = null;

// Lazily share one Redis connection across the producer queues.
let connection: Redis | null = null;
function getConnection(): Redis {
  if (!connection) connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return connection;
}

export function getSendQueue(): Queue<SendJob> {
  if (!queue) queue = new Queue<SendJob>(SEND_QUEUE, { connection: getConnection() });
  return queue;
}

export function getPreviewQueue(): Queue<PreviewJob> {
  if (!previewQueue)
    previewQueue = new Queue<PreviewJob>(PREVIEW_QUEUE, { connection: getConnection() });
  return previewQueue;
}
