const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const User = require('../../src/models/User');
const Skill = require('../../src/models/Skill');
const UserSkill = require('../../src/models/UserSkill');
const MatchRequest = require('../../src/models/MatchRequest');
const Session = require('../../src/models/Session');
const CreditTransaction = require('../../src/models/CreditTransaction');

describe('Session Lifecycle & Credit Wallet Integration Tests (Phase 4)', () => {
  let teacherToken = '';
  let learnerToken = '';
  let teacherId = '';
  let learnerId = '';
  let skillId = '';
  let matchRequestId = '';
  let sessionId = '';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({});
    await Skill.deleteMany({});
    await UserSkill.deleteMany({});
    await MatchRequest.deleteMany({});
    await Session.deleteMany({});
    await CreditTransaction.deleteMany({});

    // 1. Create Teacher (Elena - Salsa Dancing)
    const resTeacher = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Elena Rostova',
        email: 'elena@example.com',
        password: 'Password123!',
        location: { city: 'Miami', country: 'USA' }
      });
    teacherToken = resTeacher.body.token;
    teacherId = resTeacher.body.user._id;

    // 2. Create Learner (Lucas)
    const resLearner = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Lucas Silva',
        email: 'lucas@example.com',
        password: 'Password123!',
        location: { city: 'Miami', country: 'USA' }
      });
    learnerToken = resLearner.body.token;
    learnerId = resLearner.body.user._id;

    // 3. Create Salsa Skill
    const skill = await Skill.create({
      name: 'Salsa & Bachata Dancing',
      category: 'Sports',
      status: 'approved'
    });
    skillId = skill._id;

    await UserSkill.create({
      user: teacherId,
      skill: skillId,
      type: 'TEACH',
      proficiency: 'Expert'
    });
    await UserSkill.create({
      user: learnerId,
      skill: skillId,
      type: 'LEARN',
      proficiency: 'Beginner'
    });

    // 4. Create an accepted match request
    const matchRequest = await MatchRequest.create({
      sender: learnerId,
      receiver: teacherId,
      skillRequested: skillId,
      matchType: 'ONE_WAY',
      status: 'accepted'
    });
    matchRequestId = matchRequest._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Skill.deleteMany({});
    await UserSkill.deleteMany({});
    await MatchRequest.deleteMany({});
    await Session.deleteMany({});
    await CreditTransaction.deleteMany({});
    await disconnectDB();
  });

  describe('Session Proposal (POST /api/sessions)', () => {
    it('should reject session proposal if match request is not accepted', async () => {
      const pendingReq = await MatchRequest.create({
        sender: learnerId,
        receiver: teacherId,
        skillRequested: skillId,
        matchType: 'ONE_WAY',
        status: 'pending'
      });

      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          matchRequestId: pendingReq._id,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: 60,
          mode: 'online'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('only be scheduled for accepted match requests');
    });

    it('should reject session if learner has insufficient credits', async () => {
      // Temporarily set learner credits to 0
      await User.findByIdAndUpdate(learnerId, { creditBalance: 0 });

      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          matchRequestId,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: 60,
          mode: 'online'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('insufficient credits');

      // Restore learner credits to 2
      await User.findByIdAndUpdate(learnerId, { creditBalance: 2 });
    });

    it('should successfully propose a 60-minute session', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          matchRequestId,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: 60,
          mode: 'online',
          meetingLink: 'https://meet.skillswap.com/salsa-001'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('proposed');
      expect(res.body.data.durationMinutes).toBe(60);
      expect(res.body.data.teacher._id.toString()).toBe(teacherId.toString());
      expect(res.body.data.learner._id.toString()).toBe(learnerId.toString());
      sessionId = res.body.data._id;
    });
  });

  describe('Session Confirmation & Reschedule (PATCH /api/sessions/:id)', () => {
    it('should prevent the proposer (learner) from confirming their own proposal', async () => {
      const res = await request(app)
        .patch(`/api/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('waiting for the other party to confirm');
    });

    it('should allow teacher to confirm the proposed session', async () => {
      const res = await request(app)
        .patch(`/api/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('confirmed');
    });

    it('should allow rescheduling a confirmed session', async () => {
      const newTime = new Date(Date.now() + 172800000).toISOString();
      const res = await request(app)
        .patch(`/api/sessions/${sessionId}/reschedule`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ scheduledAt: newTime });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rescheduled');

      // Re-confirm by teacher
      await request(app)
        .patch(`/api/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${teacherToken}`);
    });
  });

  describe('Session Dual Completion & Credit Transfer (PATCH /api/sessions/:id/complete)', () => {
    it('should require both users to confirm completion before credits transfer', async () => {
      // Step 1: Teacher marks complete
      const resTeacher = await request(app)
        .patch(`/api/sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(resTeacher.status).toBe(200);
      expect(resTeacher.body.data.completionConfirmation.teacherConfirmed).toBe(true);
      expect(resTeacher.body.data.completionConfirmation.learnerConfirmed).toBe(false);
      expect(resTeacher.body.data.creditsTransferred).toBe(false);

      // Verify balances haven't changed yet (still 2 and 2)
      const uLearner1 = await User.findById(learnerId);
      const uTeacher1 = await User.findById(teacherId);
      expect(uLearner1.creditBalance).toBe(2);
      expect(uTeacher1.creditBalance).toBe(2);

      // Step 2: Learner marks complete -> triggers atomic credit settlement!
      const resLearner = await request(app)
        .patch(`/api/sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(resLearner.status).toBe(200);
      expect(resLearner.body.data.status).toBe('completed');
      expect(resLearner.body.data.creditsTransferred).toBe(true);
      expect(resLearner.body.settlement.success).toBe(true);
      expect(resLearner.body.settlement.credits).toBe(1.0);

      // Verify database balances: Learner spent 1 (2 -> 1), Teacher earned 1 (2 -> 3)
      const uLearner2 = await User.findById(learnerId);
      const uTeacher2 = await User.findById(teacherId);
      expect(uLearner2.creditBalance).toBe(1);
      expect(uTeacher2.creditBalance).toBe(3);
    });

    it('should show updated credit balances and transaction logs in GET /api/wallet', async () => {
      // Check Learner's wallet
      const resLearnerWallet = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(resLearnerWallet.status).toBe(200);
      expect(resLearnerWallet.body.creditBalance).toBe(1);
      expect(resLearnerWallet.body.transactions.length).toBeGreaterThanOrEqual(1);
      expect(resLearnerWallet.body.transactions[0].type).toBe('SPEND');
      expect(resLearnerWallet.body.transactions[0].amount).toBe(-1);

      // Check Teacher's wallet
      const resTeacherWallet = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(resTeacherWallet.status).toBe(200);
      expect(resTeacherWallet.body.creditBalance).toBe(3);
      expect(resTeacherWallet.body.transactions[0].type).toBe('EARN');
      expect(resTeacherWallet.body.transactions[0].amount).toBe(1);
    });
  });
});

