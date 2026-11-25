const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const User = require('../../src/models/User');

describe('Auth & User Integration Tests (Phase 1)', () => {
  let authToken = '';
  let userId = '';

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a user and grant 2 starting credits', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          password: 'SecurePassword123!',
          location: {
            city: 'Austin',
            country: 'USA'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.creditBalance).toBe(2);
      expect(res.body.user.email).toBe('sarah@example.com');
      authToken = res.body.token;
      userId = res.body.user._id;
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Duplicate',
          email: 'sarah@example.com',
          password: 'SecurePassword123!',
          city: 'Austin'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 Bad Request when validation fails', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '12'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah@example.com',
          password: 'SecurePassword123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.name).toBe('Sarah Connor');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah@example.com',
          password: 'WrongPassword!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should retrieve current user profile with valid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('sarah@example.com');
      expect(res.body.user.creditBalance).toBe(2);
    });

    it('should return 401 when token is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('User Profile Operations', () => {
    it('should update user bio and location', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'Updated bio for Sarah',
          location: {
            city: 'Dallas',
            country: 'USA'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.user.bio).toBe('Updated bio for Sarah');
      expect(res.body.user.location.city).toBe('Dallas');
    });

    it('should get public user profile by ID without leaking private fields', async () => {
      const res = await request(app).get(`/api/users/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Sarah Connor');
      expect(res.body.user.creditBalance).toBeUndefined();
    });
  });
});

