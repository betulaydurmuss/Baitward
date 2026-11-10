// Entry point: validate the environment, build the app, and start listening.
import { createApp } from './app.js';
import { env } from './env.js';
import { prisma } from './lib/prisma.js';

const app = createApp(prisma);

app.listen(env.API_PORT, () => {
  console.log(`Baitward API listening on ${env.API_BASE_URL}`);
});
