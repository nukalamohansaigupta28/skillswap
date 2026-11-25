const express = require('express');
const router = express.Router();

const { register, login, getMe, refreshToken } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);

module.exports = router;
