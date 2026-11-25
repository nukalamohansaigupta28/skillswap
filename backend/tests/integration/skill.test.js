const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const User = require('../../src/models/User');
const Skill = require('../../src/models/Skill');
const UserSkill = require('../../src/models/UserSkill');
const { seedSkills } = require('../../src/seed/skills');

describe('Skill Catalog & User Skills Integration Tests (Phase 2)', () => {
  let userToken = '';
  let adminToken = '';
  let userId = '';
  let adminId = '';
  let guitarSkillId = '';
  let pendingSkillId = '';
  let createdUserSkillId = '';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({});
    await Skill.deleteMany({});
    await UserSkill.deleteMany({});

    // Seed master catalog
    await seedSkills();

    // Register a standard user
    const resUser = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Carlos Santana',
        email: 'carlos@example.com',
        password: 'Password123!',
        location: { city: 'San Francisco', country: 'USA' }
      });
    userToken = resUser.body.token;
    userId = resUser.body.user._id;

    // Register an admin user
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@skillswap.com',
      passwordHash: await User.hashPassword('AdminPass123!'),
      location: { city: 'San Francisco', country: 'USA' },
      role: 'admin'
    });
    adminId = adminUser._id;

    const resAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@skillswap.com',
        password: 'AdminPass123!'
      });
    adminToken = resAdminLogin.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Skill.deleteMany({});
    await UserSkill.deleteMany({});
    await disconnectDB();
  });

  describe('Skill Catalog Browsing & Search (GET /api/skills)', () => {
    it('should list approved skills with pagination', async () => {
      const res = await request(app).get('/api/skills?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(10);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(40);

      // Save a skill ID for user skill tests
      guitarSkillId = res.body.data[0]._id;
    });

    it('should filter skills by category', async () => {
      const res = await request(app).get('/api/skills?category=Coding');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
      res.body.data.forEach((skill) => {
        expect(skill.category).toBe('Coding');
      });
    });

    it('should search skills by name keyword', async () => {
      const res = await request(app).get('/api/skills?search=Guitar');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toContain('Guitar');
      guitarSkillId = res.body.data[0]._id;
    });
  });

  describe('Skill Suggestion & Admin Approval (POST /api/skills, PATCH /api/skills/:id/approve)', () => {
    it('should allow regular user to suggest a skill which defaults to pending', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Origami Paper Folding',
          category: 'Art',
          description: 'Traditional Japanese geometric paper folding art.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.name).toBe('Origami Paper Folding');
      pendingSkillId = res.body.data._id;
    });

    it('should reject duplicate skill suggestion with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Origami Paper Folding',
          category: 'Art'
        });

      expect(res.status).toBe(409);
    });

    it('should forbid regular user from approving a skill', async () => {
      const res = await request(app)
        .patch(`/api/skills/${pendingSkillId}/approve`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(403);
    });

    it('should allow admin user to approve a pending skill', async () => {
      const res = await request(app)
        .patch(`/api/skills/${pendingSkillId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });
  });

  describe('User Skills Management (GET/POST/PUT/DELETE /api/users/me/skills)', () => {
    it('should add a skill to user TEACH list', async () => {
      const res = await request(app)
        .post('/api/users/me/skills')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          skillId: guitarSkillId,
          type: 'TEACH',
          proficiency: 'Expert',
          description: 'Taught over 100 students acoustic and lead guitar.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('TEACH');
      expect(res.body.data.proficiency).toBe('Expert');
      expect(res.body.data.skill.name).toBeDefined();
      createdUserSkillId = res.body.data._id;
    });

    it('should add a skill to user LEARN list', async () => {
      const res = await request(app)
        .post('/api/users/me/skills')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          skillId: pendingSkillId, // Now approved Origami
          type: 'LEARN',
          proficiency: 'Beginner',
          description: 'Want to learn complex 3D cranes and animals.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('LEARN');
    });

    it('should reject adding duplicate user skill with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/users/me/skills')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          skillId: guitarSkillId,
          type: 'TEACH',
          proficiency: 'Intermediate'
        });

      expect(res.status).toBe(409);
    });

    it('should retrieve user skills separated into TEACH and LEARN lists', async () => {
      const res = await request(app)
        .get('/api/users/me/skills')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.teach.length).toBe(1);
      expect(res.body.learn.length).toBe(1);
      expect(res.body.total).toBe(2);
    });

    it('should update user skill proficiency', async () => {
      const res = await request(app)
        .put(`/api/users/me/skills/${createdUserSkillId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          proficiency: 'Intermediate',
          description: 'Updated description: rock and blues guitar.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.proficiency).toBe('Intermediate');
    });

    it('should delete a user skill', async () => {
      const res = await request(app)
        .delete(`/api/users/me/skills/${createdUserSkillId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get('/api/users/me/skills')
        .set('Authorization', `Bearer ${userToken}`);
      expect(checkRes.body.teach.length).toBe(0);
    });
  });

  describe('Browse Teachers (GET /api/users/search?skill=&type=&location=)', () => {
    beforeAll(async () => {
      // Re-add Guitar to Carlos's teach list
      await request(app)
        .post('/api/users/me/skills')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          skillId: guitarSkillId,
          type: 'TEACH',
          proficiency: 'Expert'
        });
    });

    it('should find teachers offering Guitar in San Francisco', async () => {
      const res = await request(app).get(
        '/api/users/search?skill=Guitar&type=TEACH&location=San Francisco'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toBe('Carlos Santana');
      expect(res.body.data[0].teachSkills.length).toBeGreaterThanOrEqual(1);
    });
  });
});

