// Worker entry point. Connects to Redis and runs the send queue with the real
// processor. Connecting only happens here, at startup — importing modules for tests
// never opens a socket.
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUE_NAMES } from './queues.js';
import { workerEnv } from './env.js';
import { processSend, type SendJob } from './send-processor.js';

const connection = new Redis(workerEnv.REDIS_URL, { maxRetriesPerRequest: null });

const sendWorker = new Worker<SendJob>(QUEUE_NAMES.send, processSend, { connection });

sendWorker.on('completed', (job) => {
  console.log(`Sent campaign email for target ${job.data.campaignTargetId}`);
});
sendWorker.on('failed', (job, err) => {
  console.error(`Send job ${job?.id} failed: ${err.message}`);
});

console.log('Baitward worker ready');
