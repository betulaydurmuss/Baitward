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

export type SendJob = { campaignTargetId: string };

let queue: Queue<SendJob> | null = null;

export function getSendQueue(): Queue<SendJob> {
  if (!queue) {
    const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    queue = new Queue<SendJob>(SEND_QUEUE, { connection });
  }
  return queue;
}
