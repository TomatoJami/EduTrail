import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from './app';

describe('app', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Server is running',
    });
  });

  it('returns JSON for unknown routes', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Route not found',
    });
  });
});
