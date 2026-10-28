process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/staffsync_rate_limit_test';
process.env.JWT_SECRET = 'rate-limit-test-secret-that-is-at-least-thirty-two-characters';
process.env.FRONTEND_URL = 'http://localhost:3002';

import request from 'supertest';
const { app } = require('../src/server') as typeof import('../src/server');

describe('authentication rate limit scopes', () => {
  it('keeps registration attempts separate from login attempts and returns retry headers', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app).post('/api/auth/register').send({});
      expect(response.status).toBe(400);
    }

    const blockedRegistration = await request(app).post('/api/auth/register').send({});
    expect(blockedRegistration.status).toBe(429);
    expect(Number(blockedRegistration.headers['retry-after'])).toBeGreaterThan(0);
    expect(blockedRegistration.headers['ratelimit-limit']).toBe('10');
    expect(blockedRegistration.headers['ratelimit-remaining']).toBe('0');

    const independentLoginBudget = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(independentLoginBudget.status).toBe(400);
    expect(independentLoginBudget.status).not.toBe(429);
  });
});
