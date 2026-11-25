const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../../src/config/db');
const User = require('../../src/models/User');
const Skill = require('../../src/models/Skill');
const MatchRequest = require('../../src/models/MatchRequest');
const Session = require('../../src/models/Session');
const CreditTransaction = require('../../src/models/CreditTransaction');
const { transferSessionCredits, calculateCreditAmount } = require('../../src/services/walletService');

describe('Credit Wallet & Atomic Transfer Unit Tests (Phase 4)', () => {
  let teacherUser = null;
  let learnerUser = null;
  let mockSkill = null;
  let mockRequest = null;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Skill.deleteMany({});
    await MatchRequest.deleteMany({});
    await Session.deleteMany({});
    await CreditTransaction.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Skill.deleteMany({});
    await MatchRequest.deleteMany({});
    await Session.deleteMany({});
    await CreditTransaction.deleteMany({});

    teacherUser = await User.create({
      name: 'Teacher Teresa',
      email: 'teacher@test.com',
      passwordHash: 'hash123',
      location: { city: 'Boston' },
      creditBalance: 2 // 2 starting credits
    });

    learnerUser = await User.create({
      name: 'Learner Larry',
      email: 'learner@test.com',
      passwordHash: 'hash123',
      location: { city: 'Boston' },
      creditBalance: 2 // 2 starting credits
    });

    mockSkill = await Skill.create({
      name: 'Jazz Piano',
      category: 'Music',
      status: 'approved'
    });

    mockRequest = await MatchRequest.create({
      sender: learnerUser._id,
      receiver: teacherUser._id,
      skillRequested: mockSkill._id,
      matchType: 'ONE_WAY',
      status: 'accepted'
    });
  });

  it('should successfully transfer 1 credit from learner to teacher when both confirm completion', async () => {
    const session = await Session.create({
      matchRequest: mockRequest._id,
      teacher: teacherUser._id,
      learner: learnerUser._id,
      skill: mockSkill._id,
      scheduledAt: new Date(Date.now() + 3600000),
      durationMinutes: 60,
      mode: 'online',
      status: 'confirmed',
      proposedBy: learnerUser._id,
      completionConfirmation: {
        teacherConfirmed: true,
        learnerConfirmed: true,
        teacherConfirmedAt: new Date(),
        learnerConfirmedAt: new Date()
      },
      creditsTransferred: false
    });

    const result = await transferSessionCredits(session);

    expect(result.success).toBe(true);
    expect(result.credits).toBe(1.0);
    expect(result.learnerBalance).toBe(1); // 2 - 1 = 1
    expect(result.teacherBalance).toBe(3); // 2 + 1 = 3

    // Verify session updated
    const updatedSession = await Session.findById(session._id);
    expect(updatedSession.creditsTransferred).toBe(true);
    expect(updatedSession.status).toBe('completed');

    // Verify audit transactions written
    const txLearner = await CreditTransaction.findOne({ user: learnerUser._id, type: 'SPEND' });
    const txTeacher = await CreditTransaction.findOne({ user: teacherUser._id, type: 'EARN' });

    expect(txLearner).toBeDefined();
    expect(txLearner.amount).toBe(-1);
    expect(txLearner.balanceAfter).toBe(1);

    expect(txTeacher).toBeDefined();
    expect(txTeacher.amount).toBe(1);
    expect(txTeacher.balanceAfter).toBe(3);
  });

  it('should prevent double transfer (idempotency guard)', async () => {
    const session = await Session.create({
      matchRequest: mockRequest._id,
      teacher: teacherUser._id,
      learner: learnerUser._id,
      skill: mockSkill._id,
      scheduledAt: new Date(Date.now() + 3600000),
      durationMinutes: 60,
      mode: 'online',
      status: 'confirmed',
      proposedBy: learnerUser._id,
      completionConfirmation: {
        teacherConfirmed: true,
        learnerConfirmed: true
      },
      creditsTransferred: false
    });

    // First transfer
    const firstRes = await transferSessionCredits(session);
    expect(firstRes.success).toBe(true);

    // Second transfer attempt on the same session
    const secondRes = await transferSessionCredits(session);
    expect(secondRes.success).toBe(false);
    expect(secondRes.alreadyTransferred).toBe(true);

    // Balances must remain 1 and 3, not decremented twice
    const freshLearner = await User.findById(learnerUser._id);
    const freshTeacher = await User.findById(teacherUser._id);
    expect(freshLearner.creditBalance).toBe(1);
    expect(freshTeacher.creditBalance).toBe(3);
  });

  it('should reject transfer when learner has insufficient credits', async () => {
    // Set learner balance to 0
    await User.findByIdAndUpdate(learnerUser._id, { creditBalance: 0 });

    const session = await Session.create({
      matchRequest: mockRequest._id,
      teacher: teacherUser._id,
      learner: learnerUser._id,
      skill: mockSkill._id,
      scheduledAt: new Date(Date.now() + 3600000),
      durationMinutes: 60,
      mode: 'online',
      status: 'confirmed',
      proposedBy: learnerUser._id,
      completionConfirmation: {
        teacherConfirmed: true,
        learnerConfirmed: true
      },
      creditsTransferred: false
    });

    await expect(transferSessionCredits(session)).rejects.toThrow(/insufficient credits/i);

    // Ensure session flags remain uncompleted
    const checkSession = await Session.findById(session._id);
    expect(checkSession.creditsTransferred).toBe(false);
  });

  it('should never move credits if session is cancelled after confirmation', async () => {
    const session = await Session.create({
      matchRequest: mockRequest._id,
      teacher: teacherUser._id,
      learner: learnerUser._id,
      skill: mockSkill._id,
      scheduledAt: new Date(Date.now() + 3600000),
      durationMinutes: 60,
      mode: 'online',
      status: 'confirmed',
      proposedBy: learnerUser._id
    });

    // Cancel the session
    session.status = 'cancelled';
    await session.save();

    // Check balances
    const checkLearner = await User.findById(learnerUser._id);
    const checkTeacher = await User.findById(teacherUser._id);
    expect(checkLearner.creditBalance).toBe(2);
    expect(checkTeacher.creditBalance).toBe(2);

    const txCount = await CreditTransaction.countDocuments({ session: session._id });
    expect(txCount).toBe(0);
  });
});

