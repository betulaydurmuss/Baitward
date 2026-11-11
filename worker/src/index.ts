// Worker entry point. Connects to Redis and runs the send queue with the real
// processor. Connecting only happens here, at startup — importing modules for tests
// never opens a socket.
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUE_NAMES } from './queues.js';
import { workerEnv } from './env.js';
import { processSend, type SendJob } from './send-processor.js';
import { runScheduledDigest } from './schedule-processor.js';

const connection = new Redis(workerEnv.REDIS_URL, { maxRetriesPerRequest: null });

// Drip-sends campaign emails.
const sendWorker = new Worker<SendJob>(QUEUE_NAMES.send, processSend, { connection });
sendWorker.on('completed', (job) => {
  console.log(`Sent campaign email for target ${job.data.campaignTargetId}`);
});
sendWorker.on('failed', (job, err) => {
  console.error(`Send job ${job?.id} failed: ${err.message}`);
});

// Runs scheduled work: a monthly awareness digest to each org's admins.
const scheduleWorker = new Worker(QUEUE_NAMES.schedule, async () => runScheduledDigest(), {
  connection,
});
scheduleWorker.on('failed', (job, err) => {
  console.error(`Schedule job ${job?.id} failed: ${err.message}`);
});

// Register the repeatable monthly job (08:00 on the 1st). Repeatable jobs are
// de-duplicated by their options, so re-running the worker does not pile them up.
const scheduleQueue = new Queue(QUEUE_NAMES.schedule, { connection });
await scheduleQueue.add('monthly-digest', {}, { repeat: { pattern: '0 8 1 * *' } });

console.log('Baitward worker ready');
