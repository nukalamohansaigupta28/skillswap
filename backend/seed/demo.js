// Wrapper to support /backend/seed/demo.js path
module.exports = require('../src/seed/demo');
if (require.main === module) {
  require('../src/seed/demo');
}

