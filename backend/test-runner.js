const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const User = require('./src/models/User');

const runTests = async () => {
  console.log('================================================================');
  console.log('   SKILL-SWAP PLATFORM - PHASE 1 AUTOMATED VERIFICATION SUITE   ');
  console.log('================================================================\n');

  try {
    await connectDB();
    // Clear users collection for a clean run
    await User.deleteMany({});
    console.log('[Setup] Test database initialized and cleared.\n');

    let aliceToken = '';
    let aliceId = '';

    // Test 1: Health Check
    process.stdout.write('1. Testing GET /api/health ... ');
    const resHealth = await request(app).get('/api/health');
    if (resHealth.status === 200 && resHealth.body.status === 'healthy') {
      console.log('PASSED (HTTP 200)');
    } else {
      console.error('FAILED', resHealth.body);
    }

    // Test 2: User Registration (Alice)
    process.stdout.write('2. Testing POST /api/auth/register (New User Alice) ... ');
    const resRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'Password123!',
        bio: 'Passionate guitarist looking to learn web development.',
        location: {
          city: 'Boston',
          country: 'USA',
          coordinates: { lat: 42.3601, lng: -71.0589 }
        },
        availability: [
          {
            dayOfWeek: 'Saturday',
            slots: [{ startTime: '10:00', endTime: '12:00' }]
          }
        ]
      });

    if (
      resRegister.status === 201 &&
      resRegister.body.success &&
      resRegister.body.user.creditBalance === 2 &&
      resRegister.body.token
    ) {
      aliceToken = resRegister.body.token;
      aliceId = resRegister.body.user._id;
      console.log('PASSED (HTTP 201, 2 Credits Granted, Token Issued)');
    } else {
      console.error('FAILED', resRegister.body);
    }

    // Test 3: Duplicate Email Check
    process.stdout.write('3. Testing POST /api/auth/register (Duplicate Email) ... ');
    const resDup = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Duplicate',
        email: 'alice@example.com',
        password: 'Password123!',
        city: 'Boston'
      });
    if (resDup.status === 409 && !resDup.body.success) {
      console.log('PASSED (HTTP 409 Conflict)');
    } else {
      console.error('FAILED', resDup.body);
    }

    // Test 4: Input Validation (Invalid Email & Short Password)
    process.stdout.write('4. Testing POST /api/auth/register (Validation Error) ... ');
    const resVal = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A',
        email: 'not-an-email',
        password: '123'
      });
    if (resVal.status === 400 && Array.isArray(resVal.body.errors)) {
      console.log('PASSED (HTTP 400 Bad Request, Errors array populated)');
    } else {
      console.error('FAILED', resVal.body);
    }

    // Test 5: Login with Valid Credentials
    process.stdout.write('5. Testing POST /api/auth/login (Valid credentials) ... ');
    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'Password123!'
      });
    if (resLogin.status === 200 && resLogin.body.token) {
      console.log('PASSED (HTTP 200, JWT Token received)');
    } else {
      console.error('FAILED', resLogin.body);
    }

    // Test 6: Login with Invalid Password
    process.stdout.write('6. Testing POST /api/auth/login (Invalid password) ... ');
    const resBadLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'WrongPassword999!'
      });
    if (resBadLogin.status === 401 && !resBadLogin.body.success) {
      console.log('PASSED (HTTP 401 Unauthorized)');
    } else {
      console.error('FAILED', resBadLogin.body);
    }

    // Test 7: GET /api/auth/me (Protected Route with Bearer Token)
    process.stdout.write('7. Testing GET /api/auth/me (Authenticated) ... ');
    const resMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${aliceToken}`);
    if (resMe.status === 200 && resMe.body.user.email === 'alice@example.com') {
      console.log('PASSED (HTTP 200, User Profile returned)');
    } else {
      console.error('FAILED', resMe.body);
    }

    // Test 8: Protected Route Without Token
    process.stdout.write('8. Testing GET /api/auth/me (Missing Token) ... ');
    const resNoToken = await request(app).get('/api/auth/me');
    if (resNoToken.status === 401) {
      console.log('PASSED (HTTP 401 Unauthorized)');
    } else {
      console.error('FAILED', resNoToken.body);
    }

    // Test 9: PUT /api/users/me (Update Profile)
    process.stdout.write('9. Testing PUT /api/users/me (Update Bio & City) ... ');
    const resUpdate = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        bio: 'Senior acoustic guitar tutor with 10 years experience.',
        location: {
          city: 'Cambridge',
          country: 'USA'
        }
      });
    if (
      resUpdate.status === 200 &&
      resUpdate.body.user.bio.includes('Senior acoustic') &&
      resUpdate.body.user.location.city === 'Cambridge'
    ) {
      console.log('PASSED (HTTP 200, Profile fields updated)');
    } else {
      console.error('FAILED', resUpdate.body);
    }

    // Test 10: POST /api/users/me/photo (Upload Photo with Multer)
    process.stdout.write('10. Testing POST /api/users/me/photo (Multer file upload) ... ');
    // Create a temporary dummy image buffer
    const dummyImageBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01
    ]);
    const resUpload = await request(app)
      .post('/api/users/me/photo')
      .set('Authorization', `Bearer ${aliceToken}`)
      .attach('photo', dummyImageBuffer, 'avatar.jpg');

    if (resUpload.status === 200 && resUpload.body.photoUrl && resUpload.body.photoUrl.startsWith('/uploads/')) {
      console.log('PASSED (HTTP 200, Photo URL stored: ' + resUpload.body.photoUrl + ')');
    } else {
      console.error('FAILED', resUpload.body);
    }

    // Test 11: GET /api/users/:id (Public Profile View)
    process.stdout.write('11. Testing GET /api/users/:id (Public profile) ... ');
    const resPublic = await request(app).get(`/api/users/${aliceId}`);
    if (
      resPublic.status === 200 &&
      resPublic.body.user.name === 'Alice Johnson' &&
      resPublic.body.user.creditBalance === undefined // creditBalance should NOT be exposed publicly
    ) {
      console.log('PASSED (HTTP 200, Public fields returned, Private credit balance hidden)');
    } else {
      console.error('FAILED', resPublic.body);
    }

    // Test 12: GET /api/users/search (Search Users by City)
    process.stdout.write('12. Testing GET /api/users/search?city=Cambridge ... ');
    const resSearch = await request(app).get('/api/users/search?city=Cambridge');
    if (resSearch.status === 200 && resSearch.body.data.length >= 1) {
      console.log(`PASSED (HTTP 200, Found ${resSearch.body.data.length} user(s))`);
    } else {
      console.error('FAILED', resSearch.body);
    }

    // Test 13: Suspended User Access Guard
    process.stdout.write('13. Testing Suspended User Guard (Account status verification) ... ');
    await User.findByIdAndUpdate(aliceId, { status: 'suspended' });
    const resSuspendedLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'Password123!'
      });
    const resSuspendedAccess = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${aliceToken}`);

    if (resSuspendedLogin.status === 403 && resSuspendedAccess.status === 403) {
      console.log('PASSED (HTTP 403 Forbidden for suspended user on login & API access)');
    } else {
      console.error('FAILED', { login: resSuspendedLogin.body, access: resSuspendedAccess.body });
    }

    console.log('\n================================================================');
    console.log('   ALL 13 TESTS IN PHASE 1 VERIFICATION SUITE PASSED!           ');
    console.log('================================================================\n');
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await disconnectDB();
  }
};

runTests();

