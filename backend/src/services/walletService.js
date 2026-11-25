const mongoose = require('mongoose');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const Session = require('../models/Session');
const ApiError = require('../utils/ApiError');

/**
 * Calculates credit amount based on session duration
 * 60 minutes = 1.0 credit; 30 minutes = 0.5 credit, etc.
 */
const calculateCreditAmount = (durationMinutes = 60) => {
  return Math.round((durationMinutes / 60) * 10) / 10;
};

/**
 * Executes atomic credit transfer when both teacher and learner confirm completion
 */
const transferSessionCredits = async (sessionIdOrDoc) => {
  let session = sessionIdOrDoc;
  if (typeof sessionIdOrDoc === 'string' || sessionIdOrDoc instanceof mongoose.Types.ObjectId) {
    session = await Session.findById(sessionIdOrDoc);
  }

  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  // Edge case 1: Prevent double transfer
  if (session.creditsTransferred) {
    return {
      success: false,
      alreadyTransferred: true,
      message: 'Credits for this session have already been transferred.'
    };
  }

  // Edge case 2: Both parties must have confirmed completion
  const { teacherConfirmed, learnerConfirmed } = session.completionConfirmation;
  if (!teacherConfirmed || !learnerConfirmed) {
    return {
      success: false,
      pendingConfirmation: true,
      message: 'Waiting for both teacher and learner to confirm session completion.'
    };
  }

  const credits = calculateCreditAmount(session.durationMinutes);

  // Fresh lookup of learner and teacher
  const learner = await User.findById(session.learner);
  const teacher = await User.findById(session.teacher);

  if (!learner || !teacher) {
    throw ApiError.notFound('Learner or Teacher account could not be found');
  }

  // Edge case 3: Insufficient credits on settlement
  if (learner.creditBalance < credits) {
    throw ApiError.badRequest(
      `Learner has insufficient credits (${learner.creditBalance}) for required session transfer (${credits} credits).`
    );
  }

  // Attempt transactional transfer
  let useFallback = false;
  const mongoSession = await mongoose.startSession();

  try {
    await mongoSession.withTransaction(async () => {
      // 1. Debit learner
      const updatedLearner = await User.findOneAndUpdate(
        { _id: learner._id, creditBalance: { $gte: credits } },
        { $inc: { creditBalance: -credits } },
        { new: true, session: mongoSession }
      );

      if (!updatedLearner) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      // 2. Credit teacher
      const updatedTeacher = await User.findByIdAndUpdate(
        teacher._id,
        { $inc: { creditBalance: credits } },
        { new: true, session: mongoSession }
      );

      // 3. Log learner debit transaction
      await CreditTransaction.create(
        [
          {
            user: learner._id,
            session: session._id,
            amount: -credits,
            type: 'SPEND',
            balanceAfter: updatedLearner.creditBalance,
            description: `Spent ${credits} credit(s) for learning session (${session.durationMinutes} mins)`
          }
        ],
        { session: mongoSession }
      );

      // 4. Log teacher credit transaction
      await CreditTransaction.create(
        [
          {
            user: teacher._id,
            session: session._id,
            amount: credits,
            type: 'EARN',
            balanceAfter: updatedTeacher.creditBalance,
            description: `Earned ${credits} credit(s) for teaching session (${session.durationMinutes} mins)`
          }
        ],
        { session: mongoSession }
      );

      // 5. Update session flags
      session.creditsTransferred = true;
      session.status = 'completed';
      await session.save({ session: mongoSession });
    });
  } catch (err) {
    // If standalone MongoDB instance without replica set, fallback to conditioned atomic updates
    if (
      err.message.includes('Transaction numbers are only allowed on a replica set') ||
      err.message.includes('standalone') ||
      err.message.includes('replica set')
    ) {
      useFallback = true;
    } else if (err.message === 'INSUFFICIENT_CREDITS') {
      throw ApiError.badRequest('Learner has insufficient credits to complete transaction.');
    } else {
      throw err;
    }
  } finally {
    await mongoSession.endSession();
  }

  // Fallback for standalone dev environments
  if (useFallback) {
    const updatedLearner = await User.findOneAndUpdate(
      { _id: learner._id, creditBalance: { $gte: credits } },
      { $inc: { creditBalance: -credits } },
      { new: true }
    );

    if (!updatedLearner) {
      throw ApiError.badRequest('Learner has insufficient credits to complete transfer.');
    }

    const updatedTeacher = await User.findByIdAndUpdate(
      teacher._id,
      { $inc: { creditBalance: credits } },
      { new: true }
    );

    await CreditTransaction.create({
      user: learner._id,
      session: session._id,
      amount: -credits,
      type: 'SPEND',
      balanceAfter: updatedLearner.creditBalance,
      description: `Spent ${credits} credit(s) for learning session (${session.durationMinutes} mins)`
    });

    await CreditTransaction.create({
      user: teacher._id,
      session: session._id,
      amount: credits,
      type: 'EARN',
      balanceAfter: updatedTeacher.creditBalance,
      description: `Earned ${credits} credit(s) for teaching session (${session.durationMinutes} mins)`
    });

    session.creditsTransferred = true;
    session.status = 'completed';
    await session.save();
  }

  const freshLearner = await User.findById(learner._id);
  const freshTeacher = await User.findById(teacher._id);

  return {
    success: true,
    creditsTransferred: true,
    credits,
    learnerBalance: freshLearner.creditBalance,
    teacherBalance: freshTeacher.creditBalance
  };
};

/**
 * Retrieves credit balance and transaction history for a user
 */
const getUserWallet = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const user = await User.findById(userId).select('creditBalance name email');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const [transactions, total] = await Promise.all([
    CreditTransaction.find({ user: userId })
      .populate('session', 'scheduledAt durationMinutes mode')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }),
    CreditTransaction.countDocuments({ user: userId })
  ]);

  return {
    creditBalance: user.creditBalance,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    transactions
  };
};

module.exports = {
  calculateCreditAmount,
  transferSessionCredits,
  getUserWallet
};

