const cron = require('node-cron');
const Session = require('../models/Session');

let reminderJob = null;

const checkSessionReminders = async () => {
  try {
    const now = new Date();
    // Look for sessions scheduled between 50 and 70 minutes from current time (approx 1 hour before)
    const windowStart = new Date(now.getTime() + 50 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 70 * 60 * 1000);

    const upcomingSessions = await Session.find({
      status: 'confirmed',
      reminderSent: false,
      scheduledAt: { $gte: windowStart, $lte: windowEnd }
    }).populate('teacher learner skill');

    for (const session of upcomingSessions) {
      console.log(
        `[Cron Reminder] 1-hour session reminder: "${session.skill?.name}" between ` +
          `Teacher ${session.teacher?.name} and Learner ${session.learner?.name} ` +
          `scheduled at ${session.scheduledAt.toISOString()}`
      );

      session.reminderSent = true;
      await session.save();
    }
  } catch (err) {
    console.error('[Cron] Error running session reminder job:', err.message);
  }
};

const initCronJobs = () => {
  if (process.env.NODE_ENV === 'test') {
    return; // Don't run background cron during unit/integration tests
  }

  // Run every 10 minutes
  reminderJob = cron.schedule('*/10 * * * *', () => {
    checkSessionReminders();
  });

  console.log('[Cron] Session reminder background scheduler initialized (every 10 minutes).');
};

const stopCronJobs = () => {
  if (reminderJob) {
    reminderJob.stop();
    reminderJob = null;
    console.log('[Cron] Background scheduler stopped.');
  }
};

module.exports = {
  initCronJobs,
  stopCronJobs,
  checkSessionReminders
};

