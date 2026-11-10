import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { prisma } from './lib/prisma.js';

// The health route makes no database calls, so constructing the app with the real
// client (which does not connect until a query runs) is safe and needs no DB.
describe('GET /api/health', () => {
  it('reports the service as ok', async () => {
    const app = createApp(prisma);
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('baitward-api');
  });
});
