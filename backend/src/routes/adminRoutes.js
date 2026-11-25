const express = require('express');
const router = express.Router();

const {
  getAdminUsers,
  updateUserStatus,
  getAdminReports,
  updateReportStatus,
  getAdminAnalytics
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

// All admin routes strictly require admin role
router.use(authenticate, authorizeRoles('admin'));

// Platform Analytics & Metrics
router.get('/analytics', getAdminAnalytics);

// User Management
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', updateUserStatus);

// Safety & Abuse Reports Moderation
router.get('/reports', getAdminReports);
router.patch('/reports/:id', updateReportStatus);

module.exports = router;

