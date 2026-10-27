process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/staffsync_test';
process.env.JWT_SECRET = 'test-secret-that-is-more-than-thirty-two-characters';
process.env.FRONTEND_URL = 'http://localhost:3002';
process.env.FRONTEND_URLS = 'http://localhost:3000,http://localhost:3002,http://localhost:3003';

import request from 'supertest';
import { app } from '../src/server';

describe('API foundation and CORS', () => {
  it('exposes a health response without leaking configuration', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('ok');
    expect(response.body).not.toHaveProperty('uri');
  });

  it('rejects protected routes without a bearer token', async () => {
    const response = await request(app).get('/api/notifications');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it.each(['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'])(
    'allows credentialed OPTIONS preflight from %s', async (origin) => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type,authorization');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('authorization');
    },
  );

  it('does not accept an unconfigured origin', async () => {
    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://not-allowed.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    expect(response.status).not.toBe(204);
  });
});
