// Wrapper to support /backend/seed/skills.js path
module.exports = require('../src/seed/skills');
if (require.main === module) {
  require('../src/seed/skills');
}

