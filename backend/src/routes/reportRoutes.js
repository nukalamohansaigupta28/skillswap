const express = require('express');
const router = express.Router();

const { createReport } = require('../controllers/reportController');
const { createReportValidator } = require('../validators/reviewValidators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Submit user misconduct/safety report
router.post('/', createReportValidator, validate, createReport);

module.exports = router;

