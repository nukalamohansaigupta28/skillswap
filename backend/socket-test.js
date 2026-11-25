const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const { initSocket } = require('./src/services/socketService');
const User = require('./src/models/User');
const Skill = require('./src/models/Skill');
const MatchRequest = require('./src/models/MatchRequest');
const Message = require('./src/models/Message');
const { generateToken } = require('./src/controllers/authController');

const runSocketTest = async () => {
  console.log('================================================================');
  console.log('   SKILL-SWAP - REAL-TIME SOCKET.IO 2-CLIENT VERIFICATION TEST  ');
  console.log('================================================================\n');

  let server;
  let clientAlice;
  let clientBob;

  try {
    // 1. Setup DB and Test Data
    await connectDB();
    await User.deleteMany({});
    await Skill.deleteMany({});
    await MatchRequest.deleteMany({});
    await Message.deleteMany({});

    console.log('[1/5] Creating matched test users (Alice and Bob)...');
    const userAlice = await User.create({
      name: 'Alice Johnson',
      email: 'alice.socket@test.com',
      passwordHash: 'hash123',
      location: { city: 'Boston' },
      status: 'active'
    });

    const userBob = await User.create({
      name: 'Bob Smith',
      email: 'bob.socket@test.com',
      passwordHash: 'hash123',
      location: { city: 'Boston' },
      status: 'active'
    });

    const mockSkill = await Skill.create({
      name: 'Web Development',
      category: 'Coding',
      status: 'approved'
    });

    // Create accepted match request (Rule: chat only between accepted matches)
    await MatchRequest.create({
      sender: userAlice._id,
      receiver: userBob._id,
      skillRequested: mockSkill._id,
      matchType: 'ONE_WAY',
      status: 'accepted'
    });

    const aliceToken = generateToken(userAlice);
    const bobToken = generateToken(userBob);

    // 2. Start HTTP & Socket Server on port 5055
    console.log('[2/5] Starting test HTTP + Socket.io server on port 5055...');
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    await new Promise((resolve) => {
      server = httpServer.listen(5055, resolve);
    });

    const serverUrl = 'http://localhost:5055';

    // 3. Connect Alice & Bob Socket Clients with JWT Auth
    console.log('[3/5] Connecting Client 1 (Alice) and Client 2 (Bob) with JWT...');
    clientAlice = Client(serverUrl, {
      auth: { token: aliceToken },
      transports: ['websocket']
    });

    clientBob = Client(serverUrl, {
      auth: { token: bobToken },
      transports: ['websocket']
    });

    await Promise.all([
      new Promise((res) => clientAlice.on('connect', res)),
      new Promise((res) => clientBob.on('connect', res))
    ]);

    console.log(`      - Client Alice connected (Socket ID: ${clientAlice.id})`);
    console.log(`      - Client Bob connected   (Socket ID: ${clientBob.id})`);

    // 4. Set up message receipt verification on Bob's socket
    console.log('[4/5] Client Alice sending real-time message:send to Bob...');
    const messagePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for message:new event'));
      }, 5000);

      clientBob.on('message:new', (receivedMsg) => {
        clearTimeout(timeout);
        resolve(receivedMsg);
      });
    });

    const sentText = 'Hey Bob! Real-time Socket.io message delivery works flawlessly!';
    clientAlice.emit('message:send', {
      receiverId: userBob._id.toString(),
      text: sentText
    });

    const deliveredMessage = await messagePromise;
    console.log('[5/5] Client Bob received real-time "message:new" event:');
    console.log(`      - From: ${deliveredMessage.sender?.name}`);
    console.log(`      - Text: "${deliveredMessage.text}"`);
    console.log(`      - Timestamp: ${deliveredMessage.createdAt}`);

    if (deliveredMessage.text === sentText) {
      console.log('\n================================================================');
      console.log('   REAL-TIME SOCKET.IO TEST PASSED WITH 100% SUCCESS!          ');
      console.log('================================================================\n');
    } else {
      throw new Error('Received message text mismatch');
    }
  } catch (err) {
    console.error('Socket test failed:', err);
    process.exit(1);
  } finally {
    if (clientAlice) clientAlice.disconnect();
    if (clientBob) clientBob.disconnect();
    if (server) {
      await new Promise((res) => server.close(res));
    }
    await disconnectDB();
    process.exit(0);
  }
};

runSocketTest();

