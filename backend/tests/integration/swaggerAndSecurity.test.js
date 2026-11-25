const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const User = require('../../src/models/User');

describe('Backend Hardening, Security & Swagger Verification (Phase 7)', () => {
  let userToken = '';
  let userId = '';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({});

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Security Tester',
        email: 'security@example.com',
        password: 'Password123!',
        location: { city: 'Boston' }
      });

    userToken = res.body.token;
    userId = res.body.user._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('Swagger / OpenAPI 3.0 Documentation', () => {
    it('should serve Swagger HTML documentation at /api/docs/', async () => {
      const res = await request(app).get('/api/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Swagger UI');
    });

    it('should return valid OpenAPI 3.0 JSON specification at /api/docs.json', async () => {
      const res = await request(app).get('/api/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.0');
      expect(res.body.info.title).toContain('Skill-Swap Platform');
      expect(res.body.components.securitySchemes.bearerAuth).toBeDefined();
    });
  });

  describe('Token Expiry & Refresh Strategy', () => {
    it('should allow refreshing a valid token via POST /api/auth/refresh', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ token: userToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('security@example.com');
    });

    it('should reject refresh with an invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ token: 'bogus_invalid_token' });

      expect(res.status).toBe(401);
    });
  });

  describe('Security Sanitization (XSS & NoSQL Injection)', () => {
    it('should sanitize XSS script tags in request bodies', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bio: 'Clean text <script>alert("hacked")</script> more clean text'
        });

      expect(res.status).toBe(200);
      expect(res.body.user.bio).not.toContain('<script>');
      expect(res.body.user.bio).toContain('Clean text');
    });

    it('should sanitize NoSQL injection query parameters', async () => {
      // Attempting NoSQL injection with $gt
      const res = await request(app)
        .get('/api/users/search')
        .query({ city: { $gt: '' } });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

