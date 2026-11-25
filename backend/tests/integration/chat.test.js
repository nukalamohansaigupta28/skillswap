const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const User = require('../../src/models/User');
const Skill = require('../../src/models/Skill');
const MatchRequest = require('../../src/models/MatchRequest');
const Message = require('../../src/models/Message');
const Notification = require('../../src/models/Notification');

describe('Real-Time Chat & Notifications Integration Tests (Phase 5)', () => {
  let userAToken = '';
  let userBToken = '';
  let userCToken = '';
  let userAId = '';
  let userBId = '';
  let userCId = '';
  let mockSkill = null;
  let notificationId = '';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({});
    await Skill.deleteMany({});
    await MatchRequest.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});

    // User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User A',
        email: 'userA.chat@test.com',
        password: 'Password123!',
        location: { city: 'Boston' }
      });
    userAToken = resA.body.token;
    userAId = resA.body.user._id;

    // User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User B',
        email: 'userB.chat@test.com',
        password: 'Password123!',
        location: { city: 'Boston' }
      });
    userBToken = resB.body.token;
    userBId = resB.body.user._id;

    // User C (Unmatched User)
    const resC = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User C',
        email: 'userC.chat@test.com',
        password: 'Password123!',
        location: { city: 'Boston' }
      });
    userCToken = resC.body.token;
    userCId = resC.body.user._id;

    mockSkill = await Skill.create({
      name: 'Spanish Guitar',
      category: 'Music',
      status: 'approved'
    });

    // Create accepted match between A and B
    await MatchRequest.create({
      sender: userAId,
      receiver: userBId,
      skillRequested: mockSkill._id,
      matchType: 'ONE_WAY',
      status: 'accepted'
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Skill.deleteMany({});
    await MatchRequest.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await disconnectDB();
  });

  describe('Chat Authorization Guard', () => {
    it('should forbid chat between unmatched users (A and C)', async () => {
      const res = await request(app)
        .post(`/api/conversations/${userCId}/messages`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ text: 'Hello stranger!' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('only allowed between users with an accepted swap request');
    });

    it('should allow chat between matched users (A and B)', async () => {
      const res = await request(app)
        .post(`/api/conversations/${userBId}/messages`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ text: 'Hi User B! Excited for our skill swap.' });

      expect(res.status).toBe(201);
      expect(res.body.data.text).toBe('Hi User B! Excited for our skill swap.');
      expect(res.body.data.sender._id.toString()).toBe(userAId.toString());
      expect(res.body.data.receiver._id.toString()).toBe(userBId.toString());
    });
  });

  describe('Conversation Listing & History (GET /api/conversations)', () => {
    it('should list conversations with unread count and last message', async () => {
      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].partner._id.toString()).toBe(userAId.toString());
      expect(res.body.data[0].lastMessage.text).toContain('Excited for our skill swap');
      expect(res.body.data[0].unreadCount).toBe(1);
    });

    it('should retrieve chronological message thread', async () => {
      const res = await request(app)
        .get(`/api/conversations/${userAId}/messages`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].text).toContain('Excited for our skill swap');
    });

    it('should mark messages as read', async () => {
      const res = await request(app)
        .patch(`/api/conversations/${userAId}/read`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.modifiedCount).toBe(1);

      // Verify unread count is now 0
      const checkRes = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(checkRes.body.data[0].unreadCount).toBe(0);
    });
  });

  describe('Notifications Endpoints (GET/PATCH /api/notifications)', () => {
    beforeAll(async () => {
      // Create a test notification for User B
      const notif = await Notification.create({
        user: userBId,
        sender: userAId,
        type: 'MATCH_REQUEST',
        title: 'New Swap Request',
        body: 'User A wants to swap skills with you!',
        read: false
      });
      notificationId = notif._id;
    });

    it('should retrieve notifications with unread count', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should mark a single notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.read).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

