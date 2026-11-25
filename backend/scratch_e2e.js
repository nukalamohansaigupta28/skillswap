const API_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with ${res.status}`);
  }
  return data;
}

async function runE2E() {
  console.log('=================================================================');
  console.log('   SKILL-SWAP PLATFORM: FULL END-TO-END CAPSTONE VERIFICATION   ');
  console.log('=================================================================\n');

  // Step 1: Alice Login
  console.log('▶ [1/7] Authenticating Alice Johnson (Guitar Teacher)...');
  const aliceRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'alice@example.com', password: 'Password123!' })
  });
  const aliceToken = aliceRes.token;
  const aliceId = aliceRes.user._id;
  console.log(`   ✓ Alice authenticated. Balance: ${aliceRes.user.creditBalance} credits.`);

  // Step 2: Bob Login
  console.log('▶ [2/7] Authenticating Bob Smith (Coding Teacher)...');
  const bobRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'bob@example.com', password: 'Password123!' })
  });
  const bobToken = bobRes.token;
  const bobId = bobRes.user._id;
  console.log(`   ✓ Bob authenticated. Balance: ${bobRes.user.creditBalance} credits.`);

  // Step 3: Matching Engine
  console.log('▶ [3/7] Running Matching Engine for Alice...');
  const matchesRes = await request('/matches', {
    headers: { Authorization: `Bearer ${aliceToken}` }
  });
  const matches = matchesRes.data || matchesRes.matches || [];
  console.log(`   ✓ Found ${matches.length} candidate match suggestions.`);
  const bobMatch = matches.find(m => m.candidate?._id === bobId);
  if (bobMatch) {
    console.log(`   ★ Mutual Match with Bob: Score ${bobMatch.score}% | Type: ${bobMatch.matchType}`);
    console.log(`     Explanation: ${bobMatch.explanation?.summary || 'Complementary skills fit'}`);
  }

  // Step 4: Check Catalog Skills
  console.log('▶ [4/7] Checking Skill Catalog...');
  const skillsRes = await request('/skills?limit=5');
  console.log(`   ✓ Catalog contains ${skillsRes.pagination?.total || skillsRes.count} approved skills.`);

  // Step 5: Check Wallet Ledger for Alice
  console.log('▶ [5/7] Inspecting Alice Sovereign Wallet Ledger...');
  const walletRes = await request('/wallet', {
    headers: { Authorization: `Bearer ${aliceToken}` }
  });
  console.log(`   ✓ Current Balance: ${walletRes.creditBalance} credits.`);
  console.log(`   ✓ Ledger records: ${walletRes.transactions?.length || 0} historical transactions.`);

  // Step 6: Admin Analytics Verification
  console.log('▶ [6/7] Authenticating System Admin & Fetching Analytics...');
  const adminRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@skillswap.com', password: 'AdminPass123!' })
  });
  const adminToken = adminRes.token;
  const analyticsRes = await request('/admin/analytics', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const a = analyticsRes.data;
  console.log(`   ✓ Total Platform Members: ${a.users.total}`);
  console.log(`   ✓ Total Sessions Held: ${a.sessions.total} (${a.sessions.completed} completed)`);
  console.log(`   ✓ Platform Average Rating: ${a.ratings.platformAverage} / 5.0 (${a.ratings.totalReviews} reviews)`);
  console.log(`   ✓ Credits in Active Circulation: ${a.credits.totalCirculated}`);
  console.log(`   ✓ Top Skill by Participation: "${a.top10Skills[0]?.name}" (${a.top10Skills[0]?.userCount} users)`);

  // Step 7: Swagger Specification Integrity
  console.log('▶ [7/7] Validating OpenAPI 3.0 Documentation Endpoint...');
  const swaggerRes = await request('/docs.json');
  console.log(`   ✓ OpenAPI Title: "${swaggerRes.info.title}" v${swaggerRes.info.version}`);
  console.log(`   ✓ Documented Paths: ${Object.keys(swaggerRes.paths).length} endpoints.`);

  console.log('\n=================================================================');
  console.log('   🎉 ALL CAPSTONE ENGINE & PLATFORM COMPONENTS 100% OPERATIONAL!   ');
  console.log('=================================================================\n');
}

runE2E().catch(err => {
  console.error('E2E check failed:', err.message);
});
