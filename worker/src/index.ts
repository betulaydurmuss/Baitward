// Worker entry point. Connects to Redis and runs the send queue with the real
// processor. Connecting only happens here, at startup — importing modules for tests
// never opens a socket.
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUE_NAMES } from './queues.js';
import { workerEnv } from './env.js';
import { processSend, type SendJob } from './send-processor.js';
import { runScheduledDigest, runRetentionPurge } from './schedule-processor.js';

const connection = new Redis(workerEnv.REDIS_URL, { maxRetriesPerRequest: null });

// Drip-sends campaign emails.
const sendWorker = new Worker<SendJob>(QUEUE_NAMES.send, processSend, { connection });
sendWorker.on('completed', (job) => {
  console.log(`Sent campaign email for target ${job.data.campaignTargetId}`);
});
sendWorker.on('failed', (job, err) => {
  console.error(`Send job ${job?.id} failed: ${err.message}`);
});

// Runs scheduled work, dispatched by job name: a monthly awareness digest to each
// org's admins, and a daily data-retention purge.
const scheduleWorker = new Worker(
  QUEUE_NAMES.schedule,
  async (job) => {
    if (job.name === 'retention-purge') return runRetentionPurge();
    return runScheduledDigest();
  },
  { connection },
);
scheduleWorker.on('failed', (job, err) => {
  console.error(`Schedule job ${job?.id} failed: ${err.message}`);
});

// Register the repeatable jobs. Repeatable jobs are de-duplicated by their options,
// so re-running the worker does not pile them up.
const scheduleQueue = new Queue(QUEUE_NAMES.schedule, { connection });
// Monthly awareness digest — 08:00 on the 1st.
await scheduleQueue.add('monthly-digest', {}, { repeat: { pattern: '0 8 1 * *' } });
// Data-retention purge — daily at 03:00.
await scheduleQueue.add('retention-purge', {}, { repeat: { pattern: '0 3 * * *' } });

console.log('Baitward worker ready');
