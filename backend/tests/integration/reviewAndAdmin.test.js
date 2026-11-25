const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const User = require('../../src/models/User');
const Skill = require('../../src/models/Skill');
const MatchRequest = require('../../src/models/MatchRequest');
const Session = require('../../src/models/Session');
const Review = require('../../src/models/Review');
const Report = require('../../src/models/Report');
const CreditTransaction = require('../../src/models/CreditTransaction');

describe('Reviews, Ratings, Safety Reports & Admin Analytics (Phase 6)', () => {
  let adminToken = '';
  let teacherToken = '';
  let learnerToken = '';
  let teacherId = '';
  let learnerId = '';
  let adminId = '';
  let completedSessionId = '';
  let proposedSessionId = '';
  let createdReportId = '';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({});
    await Skill.deleteMany({});
    await MatchRequest.deleteMany({});
    await Session.deleteMany({});
    await Review.deleteMany({});
    await Report.deleteMany({});
    await CreditTransaction.deleteMany({});

    // 1. Create Admin
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin.phase6@test.com',
      passwordHash: await User.hashPassword('AdminPass123!'),
      location: { city: 'New York' },
      role: 'admin'
    });
    adminId = adminUser._id;

    const resAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.phase6@test.com', password: 'AdminPass123!' });
    adminToken = resAdminLogin.body.token;

    // 2. Create Teacher (Chef Marco)
    const resTeacher = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Marco Pierre',
        email: 'marco.phase6@test.com',
        password: 'Password123!',
        location: { city: 'New York' }
      });
    teacherToken = resTeacher.body.token;
    teacherId = resTeacher.body.user._id;

    // 3. Create Learner (Student Sam)
    const resLearner = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sam Student',
        email: 'sam.phase6@test.com',
        password: 'Password123!',
        location: { city: 'New York' }
      });
    learnerToken = resLearner.body.token;
    learnerId = resLearner.body.user._id;

    const cookingSkill = await Skill.create({
      name: 'French Sauce Mastery',
      category: 'Cooking',
      status: 'approved'
    });

    const matchReq = await MatchRequest.create({
      sender: learnerId,
      receiver: teacherId,
      skillRequested: cookingSkill._id,
      matchType: 'ONE_WAY',
      status: 'accepted'
    });

    // Create a completed session
    const completedSession = await Session.create({
      matchRequest: matchReq._id,
      teacher: teacherId,
      learner: learnerId,
      skill: cookingSkill._id,
      scheduledAt: new Date(Date.now() - 3600000),
      durationMinutes: 60,
      mode: 'online',
      status: 'completed',
      proposedBy: learnerId,
      completionConfirmation: {
        teacherConfirmed: true,
        learnerConfirmed: true
      },
      creditsTransferred: true
    });
    completedSessionId = completedSession._id;

    // Create an uncompleted proposed session
    const proposedSession = await Session.create({
      matchRequest: matchReq._id,
      teacher: teacherId,
      learner: learnerId,
      skill: cookingSkill._id,
      scheduledAt: new Date(Date.now() + 86400000),
      durationMinutes: 60,
      mode: 'online',
      status: 'proposed',
      proposedBy: learnerId
    });
    proposedSessionId = proposedSession._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Skill.deleteMany({});
    await MatchRequest.deleteMany({});
    await Session.deleteMany({});
    await Review.deleteMany({});
    await Report.deleteMany({});
    await CreditTransaction.deleteMany({});
    await disconnectDB();
  });

  describe('Reviews & Ratings Flow (POST /api/reviews & GET /api/users/:id/reviews)', () => {
    it('should reject a review if the session is not completed', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          sessionId: proposedSessionId,
          rating: 5,
          comment: 'Premature review'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('only be submitted after a session is completed');
    });

    it('should allow learner to submit a 5-star review for the completed session', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          sessionId: completedSessionId,
          rating: 5,
          comment: 'Chef Marco is an incredible instructor! The béchamel sauce came out perfect.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.reviewer._id.toString()).toBe(learnerId.toString());
      expect(res.body.data.reviewee._id.toString()).toBe(teacherId.toString());

      // Verify that Marco's average rating was automatically updated in the DB
      const freshMarco = await User.findById(teacherId);
      expect(freshMarco.ratingAverage).toBe(5.0);
      expect(freshMarco.ratingCount).toBe(1);
    });

    it('should reject duplicate review for the same session by the same user', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          sessionId: completedSessionId,
          rating: 4,
          comment: 'Trying to review again'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already submitted a review for this session');
    });

    it('should get public reviews for a user with rating summary', async () => {
      const res = await request(app).get(`/api/users/${teacherId}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body.ratingSummary.average).toBe(5.0);
      expect(res.body.ratingSummary.count).toBe(1);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].comment).toContain('béchamel sauce');
    });
  });

  describe('User Safety & Reports (POST /api/reports)', () => {
    it('should prevent user from reporting themselves', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          reportedUserId: learnerId,
          reason: 'SPAM',
          details: 'Reporting myself'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot submit a report against yourself');
    });

    it('should allow user to file a report against another user', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          reportedUserId: teacherId,
          reason: 'NO_SHOW',
          details: 'Teacher arrived 30 minutes late to session.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('open');
      expect(res.body.data.reason).toBe('NO_SHOW');
      createdReportId = res.body.data._id;
    });
  });

  describe('Admin Endpoints & Governance (/api/admin)', () => {
    it('should forbid non-admin users from accessing admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to list all users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should allow admin to suspend a user', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${learnerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'suspended' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('suspended');

      // Verify suspended user cannot access protected endpoints
      const checkAccess = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(checkAccess.status).toBe(403);

      // Re-activate learner
      await request(app)
        .patch(`/api/admin/users/${learnerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });
    });

    it('should allow admin to view reports and resolve a report', async () => {
      // List reports
      const resList = await request(app)
        .get('/api/admin/reports?status=open')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resList.status).toBe(200);
      expect(resList.body.data.length).toBeGreaterThanOrEqual(1);

      // Resolve report
      const resResolve = await request(app)
        .patch(`/api/admin/reports/${createdReportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          resolutionNotes: 'Spoke with both parties, issue resolved amicably.'
        });

      expect(resResolve.status).toBe(200);
      expect(resResolve.body.data.status).toBe('resolved');
      expect(resResolve.body.data.resolvedBy._id.toString()).toBe(adminId.toString());
    });

    it('should return complete platform analytics for admin dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const metrics = res.body.data;
      expect(metrics.users.total).toBeGreaterThanOrEqual(3);
      expect(metrics.sessions.total).toBeGreaterThanOrEqual(2);
      expect(metrics.sessions.completed).toBeGreaterThanOrEqual(1);
      expect(metrics.ratings.platformAverage).toBe(5.0);
      expect(Array.isArray(metrics.sessions.sessionsPerWeek)).toBe(true);
      expect(Array.isArray(metrics.top10Skills)).toBe(true);
    });
  });
});

