const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const User = require('../../src/models/User');
const Skill = require('../../src/models/Skill');
const UserSkill = require('../../src/models/UserSkill');
const MatchRequest = require('../../src/models/MatchRequest');

describe('Matching Engine & Swap Requests Integration Tests (Phase 3)', () => {
  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';
  let guitarSkill = null;
  let codingSkill = null;
  let createdRequestId = '';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({});
    await Skill.deleteMany({});
    await UserSkill.deleteMany({});
    await MatchRequest.deleteMany({});

    // Create 2 catalog skills
    guitarSkill = await Skill.create({
      name: 'Acoustic Guitar Lessons',
      category: 'Music',
      status: 'approved'
    });

    codingSkill = await Skill.create({
      name: 'Full Stack React & Node',
      category: 'Coding',
      status: 'approved'
    });

    // Create User A (Alice): Teaches Guitar, Wants Coding
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Johnson',
        email: 'alice.phase3@example.com',
        password: 'Password123!',
        location: { city: 'Boston', country: 'USA' }
      });
    userAToken = resA.body.token;
    userAId = resA.body.user._id;

    // Create User B (Bob): Teaches Coding, Wants Guitar
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Smith',
        email: 'bob.phase3@example.com',
        password: 'Password123!',
        location: { city: 'Boston', country: 'USA' }
      });
    userBToken = resB.body.token;
    userBId = resB.body.user._id;

    // Alice skills
    await UserSkill.create({
      user: userAId,
      skill: guitarSkill._id,
      type: 'TEACH',
      proficiency: 'Expert'
    });
    await UserSkill.create({
      user: userAId,
      skill: codingSkill._id,
      type: 'LEARN',
      proficiency: 'Beginner'
    });

    // Bob skills
    await UserSkill.create({
      user: userBId,
      skill: codingSkill._id,
      type: 'TEACH',
      proficiency: 'Expert'
    });
    await UserSkill.create({
      user: userBId,
      skill: guitarSkill._id,
      type: 'LEARN',
      proficiency: 'Beginner'
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Skill.deleteMany({});
    await UserSkill.deleteMany({});
    await MatchRequest.deleteMany({});
    await disconnectDB();
  });

  describe('GET /api/matches', () => {
    it('should return ranked matches with score and explanation breakdown', async () => {
      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.matches.length).toBeGreaterThanOrEqual(1);
      const match = res.body.matches[0];
      expect(match.user._id.toString()).toBe(userBId.toString());
      expect(match.matchType).toBe('MUTUAL');
      expect(match.isCreditBased).toBe(false);
      expect(match.score).toBeGreaterThanOrEqual(60);
      expect(match.explanation.factors.length).toBeGreaterThan(0);
    });

    it('should inspect detailed match analysis with a specific candidate', async () => {
      const res = await request(app)
        .get(`/api/matches/${userBId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.isMatch).toBe(true);
      expect(res.body.targetUser.name).toBe('Bob Smith');
      expect(res.body.matchType).toBe('MUTUAL');
    });

    it('should reject match analysis with oneself', async () => {
      const res = await request(app)
        .get(`/api/matches/${userAId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/requests', () => {
    it('should successfully send a mutual swap request', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          receiverId: userBId,
          skillRequestedId: codingSkill._id,
          skillOfferedId: guitarSkill._id,
          matchType: 'MUTUAL',
          message: 'Hi Bob! Would love to trade guitar for web dev lessons.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.matchType).toBe('MUTUAL');
      createdRequestId = res.body.data._id;
    });

    it('should prevent sending duplicate pending requests', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          receiverId: userBId,
          skillRequestedId: codingSkill._id,
          skillOfferedId: guitarSkill._id,
          matchType: 'MUTUAL'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already have a pending swap request');
    });

    it('should prevent self-requests', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          receiverId: userAId,
          skillRequestedId: codingSkill._id
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot send a swap request to yourself');
    });

    it('should prevent sending request to suspended users', async () => {
      await User.findByIdAndUpdate(userBId, { status: 'suspended' });

      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          receiverId: userBId,
          skillRequestedId: codingSkill._id,
          matchType: 'ONE_WAY'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('suspended');

      // Restore Bob's status
      await User.findByIdAndUpdate(userBId, { status: 'active' });
    });
  });

  describe('GET /api/requests and PATCH /api/requests/:id', () => {
    it('should list received requests for Bob', async () => {
      const res = await request(app)
        .get('/api/requests?type=received&status=pending')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(createdRequestId.toString());
    });

    it('should list sent requests for Alice', async () => {
      const res = await request(app)
        .get('/api/requests?type=sent')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].receiver._id.toString()).toBe(userBId.toString());
    });

    it('should forbid Alice (sender) from accepting her own sent request', async () => {
      const res = await request(app)
        .patch(`/api/requests/${createdRequestId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ action: 'accept' });

      expect(res.status).toBe(403);
    });

    it('should allow Bob (receiver) to accept the request', async () => {
      const res = await request(app)
        .patch(`/api/requests/${createdRequestId}/accept`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('accepted');
    });
  });
});

