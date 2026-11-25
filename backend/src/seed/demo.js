const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const MatchRequest = require('../models/MatchRequest');
const Session = require('../models/Session');
const Review = require('../models/Review');
const Report = require('../models/Report');
const CreditTransaction = require('../models/CreditTransaction');
const { seedSkills } = require('./skills');

const demoUsersData = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    bio: 'Acoustic fingerstyle guitarist with 8 years of experience. Eager to master web development.',
    city: 'Boston',
    coordinates: { lat: 42.3601, lng: -71.0589 },
    availability: [{ dayOfWeek: 'Saturday', slots: [{ startTime: '10:00', endTime: '13:00' }] }]
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    bio: 'Lead frontend engineer specialized in React, Vite, and Tailwind. Wanting to learn guitar chords.',
    city: 'Boston',
    coordinates: { lat: 42.3555, lng: -71.0601 },
    availability: [{ dayOfWeek: 'Saturday', slots: [{ startTime: '11:00', endTime: '14:00' }] }]
  },
  {
    name: 'Carlos Santana',
    email: 'carlos@example.com',
    bio: 'Native Spanish speaker and linguist. Looking for hands-on Python data analysis tutoring.',
    city: 'San Francisco',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    availability: [{ dayOfWeek: 'Sunday', slots: [{ startTime: '14:00', endTime: '17:00' }] }]
  },
  {
    name: 'Diana Prince',
    email: 'diana@example.com',
    bio: 'Keynote public speaker and TEDx coach. Interested in beginner French for an upcoming travel tour.',
    city: 'Chicago',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    availability: [{ dayOfWeek: 'Tuesday', slots: [{ startTime: '18:00', endTime: '20:00' }] }]
  },
  {
    name: 'Ethan Hunt',
    email: 'ethan@example.com',
    bio: 'Calisthenics athlete and gymnastics coach. Wanting to edit fitness reels on Premiere Pro.',
    city: 'Austin',
    coordinates: { lat: 30.2672, lng: -97.7431 },
    availability: [{ dayOfWeek: 'Wednesday', slots: [{ startTime: '08:00', endTime: '10:00' }] }]
  },
  {
    name: 'Fiona Gallagher',
    email: 'fiona@example.com',
    bio: 'Bakehouse chef specializing in wild sourdough loaves. Looking for guided Vinyasa yoga sessions.',
    city: 'Seattle',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    availability: [{ dayOfWeek: 'Monday', slots: [{ startTime: '09:00', endTime: '11:00' }] }]
  },
  {
    name: 'George Clark',
    email: 'george@example.com',
    bio: 'Economics graduate teaching microeconomics and market theory. Avid student of competitive chess.',
    city: 'Denver',
    coordinates: { lat: 39.7392, lng: -104.9903 },
    availability: [{ dayOfWeek: 'Thursday', slots: [{ startTime: '17:00', endTime: '19:00' }] }]
  },
  {
    name: 'Hannah Abbott',
    email: 'hannah@example.com',
    bio: 'Plein air watercolor artist. Passionate foodie looking to learn traditional Italian pasta shaping.',
    city: 'New York',
    coordinates: { lat: 40.7128, lng: -74.006 },
    availability: [{ dayOfWeek: 'Sunday', slots: [{ startTime: '10:00', endTime: '12:00' }] }]
  },
  {
    name: 'Ian Wright',
    email: 'ian@example.com',
    bio: 'Latin dance instructor teaching salsa and bachata rhythm. Wanting professional business English coaching.',
    city: 'Miami',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    availability: [{ dayOfWeek: 'Friday', slots: [{ startTime: '19:00', endTime: '21:00' }] }]
  },
  {
    name: 'Julia Roberts',
    email: 'julia@example.com',
    bio: 'Vocal coach and theatre actor. Learning UI/UX design systems in Figma.',
    city: 'Los Angeles',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    availability: [{ dayOfWeek: 'Thursday', slots: [{ startTime: '15:00', endTime: '17:00' }] }]
  },
  {
    name: 'Kevin Bacon',
    email: 'kevin@example.com',
    bio: 'Drummer with touring rock bands. Always fascinated by ceramics and pottery wheel turning.',
    city: 'Philadelphia',
    coordinates: { lat: 39.9526, lng: -75.1652 },
    availability: [{ dayOfWeek: 'Saturday', slots: [{ startTime: '13:00', endTime: '16:00' }] }]
  },
  {
    name: 'Laura Croft',
    email: 'laura@example.com',
    bio: 'English literature teacher and essay writing mentor. Looking for tennis topspin lessons.',
    city: 'Boston',
    coordinates: { lat: 42.3601, lng: -71.0589 },
    availability: [{ dayOfWeek: 'Sunday', slots: [{ startTime: '09:00', endTime: '11:00' }] }]
  },
  {
    name: 'Michael Scott',
    email: 'michael@example.com',
    bio: 'Sales presentation mentor and humorist. Complete beginner wanting to play pop tunes on piano.',
    city: 'Scranton',
    coordinates: { lat: 41.409, lng: -75.6624 },
    availability: [{ dayOfWeek: 'Monday', slots: [{ startTime: '18:00', endTime: '20:00' }] }]
  },
  {
    name: 'Nina Simone',
    email: 'nina@example.com',
    bio: 'Classical and blues piano virtuoso. Seeking assistance with organic chemistry reaction diagrams.',
    city: 'Atlanta',
    coordinates: { lat: 33.749, lng: -84.388 },
    availability: [{ dayOfWeek: 'Wednesday', slots: [{ startTime: '16:00', endTime: '18:00' }] }]
  },
  {
    name: 'Oscar Martinez',
    email: 'oscar@example.com',
    bio: 'Certified financial planner teaching index fund investing and budgeting. Wants to learn Japanese.',
    city: 'San Diego',
    coordinates: { lat: 32.7157, lng: -117.1611 },
    availability: [{ dayOfWeek: 'Saturday', slots: [{ startTime: '11:00', endTime: '13:00' }] }]
  },
  {
    name: 'Priya Patel',
    email: 'priya@example.com',
    bio: 'Home chef master of authentic North & South Indian curries. Exploring machine learning in PyTorch.',
    city: 'Dallas',
    coordinates: { lat: 32.7767, lng: -96.797 },
    availability: [{ dayOfWeek: 'Sunday', slots: [{ startTime: '15:00', endTime: '17:00' }] }]
  },
  {
    name: 'Quentin Tarantino',
    email: 'quentin@example.com',
    bio: 'Cinematographer teaching pacing, color grading, and framing. Wants conversational German.',
    city: 'Austin',
    coordinates: { lat: 30.2672, lng: -97.7431 },
    availability: [{ dayOfWeek: 'Tuesday', slots: [{ startTime: '19:00', endTime: '21:00' }] }]
  },
  {
    name: 'Rachel Green',
    email: 'rachel@example.com',
    bio: 'Digital illustrator creating stylized character art in Procreate. Wants plant-based meal prep.',
    city: 'New York',
    coordinates: { lat: 40.7128, lng: -74.006 },
    availability: [{ dayOfWeek: 'Friday', slots: [{ startTime: '14:00', endTime: '16:00' }] }]
  },
  {
    name: 'Steve Rogers',
    email: 'steve@example.com',
    bio: 'Marathon runner and endurance swimming coach. Looking for beginner woodworking skills.',
    city: 'Washington',
    coordinates: { lat: 38.9072, lng: -77.0369 },
    availability: [{ dayOfWeek: 'Saturday', slots: [{ startTime: '07:00', endTime: '10:00' }] }]
  },
  {
    name: 'Tina Fey',
    email: 'tina@example.com',
    bio: 'Comedy writer teaching spontaneous storytelling and improv. Needs college calculus help.',
    city: 'Chicago',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    availability: [{ dayOfWeek: 'Sunday', slots: [{ startTime: '13:00', endTime: '15:00' }] }]
  }
];

const seedDemoData = async () => {
  try {
    console.log('[Demo Seed] Initializing database...');
    await connectDB();

    console.log('[Demo Seed] Ensuring skill catalog is seeded...');
    await seedSkills();

    console.log('[Demo Seed] Clearing existing test records...');
    await User.deleteMany({});
    await UserSkill.deleteMany({});
    await MatchRequest.deleteMany({});
    await Session.deleteMany({});
    await Review.deleteMany({});
    await Report.deleteMany({});
    await CreditTransaction.deleteMany({});

    // 1. Create Admin Account
    console.log('[Demo Seed] Creating System Admin (admin@skillswap.com)...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@skillswap.com',
      passwordHash: await User.hashPassword('AdminPass123!'),
      bio: 'Skill-Swap Platform Senior Moderator & Governance Lead.',
      location: { city: 'San Francisco', country: 'USA' },
      role: 'admin',
      status: 'active',
      creditBalance: 100
    });

    // 2. Create 20 Demo Users
    console.log('[Demo Seed] Creating 20 diverse demo users...');
    const createdUsers = [];
    const passwordHash = await User.hashPassword('Password123!');

    for (const userData of demoUsersData) {
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        passwordHash,
        bio: userData.bio,
        location: {
          city: userData.city,
          country: 'USA',
          coordinates: userData.coordinates
        },
        availability: userData.availability,
        role: 'user',
        status: 'active',
        creditBalance: 2 // 2 starting credits
      });

      // Log welcome bonus transaction
      await CreditTransaction.create({
        user: user._id,
        amount: 2,
        type: 'BONUS',
        balanceAfter: 2,
        description: 'Welcome onboard bonus: 2 initial free skill credits!'
      });

      createdUsers.push(user);
    }

    // 3. Assign Skills to Users
    console.log('[Demo Seed] Mapping TEACH and LEARN skills to demo users...');
    const catalog = await Skill.find({ status: 'approved' });
    const findSkill = (nameKeyword) => catalog.find((s) => s.name.toLowerCase().includes(nameKeyword.toLowerCase())) || catalog[0];

    // Alice & Bob (Boston Pair - Mutual)
    const guitar = findSkill('Guitar');
    const jsReact = findSkill('JavaScript');
    await UserSkill.create({ user: createdUsers[0]._id, skill: guitar._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[0]._id, skill: jsReact._id, type: 'LEARN', proficiency: 'Beginner' });
    await UserSkill.create({ user: createdUsers[1]._id, skill: jsReact._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[1]._id, skill: guitar._id, type: 'LEARN', proficiency: 'Beginner' });

    // Carlos & Priya (Python & Cooking)
    const spanish = findSkill('Spanish');
    const python = findSkill('Python');
    const curry = findSkill('Curry');
    await UserSkill.create({ user: createdUsers[2]._id, skill: spanish._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[2]._id, skill: python._id, type: 'LEARN', proficiency: 'Beginner' });
    await UserSkill.create({ user: createdUsers[15]._id, skill: curry._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[15]._id, skill: python._id, type: 'LEARN', proficiency: 'Intermediate' });

    // Diana & Tina (Chicago - Public Speaking & Calculus)
    const speaking = findSkill('Speaking');
    const french = findSkill('French');
    const calculus = findSkill('Calculus');
    await UserSkill.create({ user: createdUsers[3]._id, skill: speaking._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[3]._id, skill: french._id, type: 'LEARN', proficiency: 'Beginner' });
    await UserSkill.create({ user: createdUsers[19]._id, skill: calculus._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[19]._id, skill: speaking._id, type: 'LEARN', proficiency: 'Intermediate' });

    // Ethan & Quentin (Austin - Calisthenics & Video)
    const calisthenics = findSkill('Calisthenics');
    const video = findSkill('Video');
    await UserSkill.create({ user: createdUsers[4]._id, skill: calisthenics._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[4]._id, skill: video._id, type: 'LEARN', proficiency: 'Intermediate' });
    await UserSkill.create({ user: createdUsers[16]._id, skill: video._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[16]._id, skill: calisthenics._id, type: 'LEARN', proficiency: 'Beginner' });

    // Fiona & Steve (Sourdough & Swimming)
    const sourdough = findSkill('Sourdough');
    const swimming = findSkill('Swimming');
    await UserSkill.create({ user: createdUsers[5]._id, skill: sourdough._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[5]._id, skill: swimming._id, type: 'LEARN', proficiency: 'Beginner' });
    await UserSkill.create({ user: createdUsers[18]._id, skill: swimming._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[18]._id, skill: sourdough._id, type: 'LEARN', proficiency: 'Intermediate' });

    // Hannah & Rachel (New York - Watercolor & Procreate)
    const watercolor = findSkill('Watercolor');
    const procreate = findSkill('Procreate');
    await UserSkill.create({ user: createdUsers[7]._id, skill: watercolor._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[7]._id, skill: procreate._id, type: 'LEARN', proficiency: 'Beginner' });
    await UserSkill.create({ user: createdUsers[17]._id, skill: procreate._id, type: 'TEACH', proficiency: 'Expert' });
    await UserSkill.create({ user: createdUsers[17]._id, skill: watercolor._id, type: 'LEARN', proficiency: 'Beginner' });

    // 4. Create Sample Match Requests
    console.log('[Demo Seed] Generating active & historical match requests...');
    const req1 = await MatchRequest.create({
      sender: createdUsers[0]._id, // Alice
      receiver: createdUsers[1]._id, // Bob
      skillOffered: guitar._id,
      skillRequested: jsReact._id,
      matchType: 'MUTUAL',
      status: 'accepted',
      message: 'Hi Bob! Would love to swap guitar lessons for your React coaching.'
    });

    const req2 = await MatchRequest.create({
      sender: createdUsers[4]._id, // Ethan
      receiver: createdUsers[16]._id, // Quentin
      skillOffered: calisthenics._id,
      skillRequested: video._id,
      matchType: 'MUTUAL',
      status: 'accepted',
      message: 'Hey Quentin, big fan! Happy to teach bodyweight control for video pacing lessons.'
    });

    const req3 = await MatchRequest.create({
      sender: createdUsers[3]._id, // Diana
      receiver: createdUsers[19]._id, // Tina
      skillOffered: speaking._id,
      skillRequested: calculus._id,
      matchType: 'MUTUAL',
      status: 'pending',
      message: 'Hi Tina! Would love to schedule an introductory swap.'
    });

    // 5. Create Sample Sessions
    console.log('[Demo Seed] Creating sample sessions and settling credit transactions...');
    // Completed Session 1: Bob taught Alice React
    const sess1 = await Session.create({
      matchRequest: req1._id,
      teacher: createdUsers[1]._id,
      learner: createdUsers[0]._id,
      skill: jsReact._id,
      scheduledAt: new Date(Date.now() - 3 * 86400000),
      durationMinutes: 60,
      mode: 'online',
      meetingLink: 'https://meet.skillswap.com/react-class',
      status: 'completed',
      proposedBy: createdUsers[0]._id,
      completionConfirmation: { teacherConfirmed: true, learnerConfirmed: true },
      creditsTransferred: true
    });

    // Transfer credits: Alice spent 1 (2 -> 1), Bob earned 1 (2 -> 3)
    await User.findByIdAndUpdate(createdUsers[0]._id, { creditBalance: 1 });
    await User.findByIdAndUpdate(createdUsers[1]._id, { creditBalance: 3 });

    await CreditTransaction.create({
      user: createdUsers[0]._id,
      session: sess1._id,
      amount: -1,
      type: 'SPEND',
      balanceAfter: 1,
      description: 'Spent 1 credit for learning JavaScript & Modern React'
    });
    await CreditTransaction.create({
      user: createdUsers[1]._id,
      session: sess1._id,
      amount: 1,
      type: 'EARN',
      balanceAfter: 3,
      description: 'Earned 1 credit for teaching JavaScript & Modern React'
    });

    // Completed Session 2: Alice taught Bob Guitar
    const sess2 = await Session.create({
      matchRequest: req1._id,
      teacher: createdUsers[0]._id,
      learner: createdUsers[1]._id,
      skill: guitar._id,
      scheduledAt: new Date(Date.now() - 1 * 86400000),
      durationMinutes: 60,
      mode: 'online',
      meetingLink: 'https://meet.skillswap.com/guitar-class',
      status: 'completed',
      proposedBy: createdUsers[1]._id,
      completionConfirmation: { teacherConfirmed: true, learnerConfirmed: true },
      creditsTransferred: true
    });

    // Transfer credits: Bob spent 1 (3 -> 2), Alice earned 1 (1 -> 2)
    await User.findByIdAndUpdate(createdUsers[1]._id, { creditBalance: 2 });
    await User.findByIdAndUpdate(createdUsers[0]._id, { creditBalance: 2 });

    await CreditTransaction.create({
      user: createdUsers[1]._id,
      session: sess2._id,
      amount: -1,
      type: 'SPEND',
      balanceAfter: 2,
      description: 'Spent 1 credit for learning Acoustic Guitar'
    });
    await CreditTransaction.create({
      user: createdUsers[0]._id,
      session: sess2._id,
      amount: 1,
      type: 'EARN',
      balanceAfter: 2,
      description: 'Earned 1 credit for teaching Acoustic Guitar'
    });

    // Upcoming Confirmed Session: Ethan & Quentin
    await Session.create({
      matchRequest: req2._id,
      teacher: createdUsers[16]._id,
      learner: createdUsers[4]._id,
      skill: video._id,
      scheduledAt: new Date(Date.now() + 2 * 86400000),
      durationMinutes: 60,
      mode: 'online',
      meetingLink: 'https://meet.skillswap.com/video-premiere',
      status: 'confirmed',
      proposedBy: createdUsers[4]._id
    });

    // 6. Create Reviews
    console.log('[Demo Seed] Posting authentic reviews and updating user rating averages...');
    await Review.create({
      session: sess1._id,
      reviewer: createdUsers[0]._id,
      reviewee: createdUsers[1]._id,
      rating: 5,
      comment: 'Bob is a top-notch mentor! Clear explanations of components, hooks, and clean state structure.'
    });

    await Review.create({
      session: sess2._id,
      reviewer: createdUsers[1]._id,
      reviewee: createdUsers[0]._id,
      rating: 5,
      comment: 'Alice made fingerpicking so easy to pick up. Loved the step-by-step chord progression exercises!'
    });

    // 7. Create a Sample Safety Report
    console.log('[Demo Seed] Creating sample dispute report for admin moderation testing...');
    await Report.create({
      reporter: createdUsers[6]._id, // George
      reportedUser: createdUsers[12]._id, // Michael
      reason: 'NO_SHOW',
      details: 'Participant missed the scheduled meeting without prior warning.',
      status: 'open'
    });

    console.log('\n================================================================');
    console.log('   DEMO SEED COMPLETED SUCCESSFULLY!                            ');
    console.log('================================================================');
    console.log('Admin Account:');
    console.log('   Email:    admin@skillswap.com');
    console.log('   Password: AdminPass123!');
    console.log('\nDemo User Accounts (20 users):');
    console.log('   Alice:    alice@example.com    / Password123! (Boston)');
    console.log('   Bob:      bob@example.com      / Password123! (Boston)');
    console.log('   Carlos:   carlos@example.com   / Password123! (San Francisco)');
    console.log('   ...and 17 more across US cities!');
    console.log('================================================================\n');

    return { success: true, userCount: createdUsers.length + 1 };
  } catch (err) {
    console.error('[Demo Seed] Error:', err);
    throw err;
  } finally {
    if (require.main === module) {
      await disconnectDB();
      process.exit(0);
    }
  }
};

if (require.main === module) {
  seedDemoData();
}

module.exports = { seedDemoData };

