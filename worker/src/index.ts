// Worker entry point. For now it connects to Redis and stands up a worker for the
// send queue that does nothing but acknowledge jobs; real drip-sending logic lands
// in Phase 2. Connecting only happens here, at startup — importing modules for
// tests never opens a socket.
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUE_NAMES } from './queues.js';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

function start() {
  const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

  const sendWorker = new Worker(
    QUEUE_NAMES.send,
    async (job) => {
      // Placeholder: real sending (Nodemailer + per-recipient token) comes in Phase 2.
      console.log(`Received job ${job.id} on queue "${QUEUE_NAMES.send}"`);
    },
    { connection },
  );

  console.log('Baitward worker ready');

  return sendWorker;
}

start();
