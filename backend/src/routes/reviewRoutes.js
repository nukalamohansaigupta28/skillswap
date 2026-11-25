const express = require('express');
const router = express.Router();

const { createReview, getUserReviews } = require('../controllers/reviewController');
const { createReviewValidator } = require('../validators/reviewValidators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

// Public route to view reviews for a user
router.get('/user/:id', getUserReviews);

// Protected route to post a review after completed session
router.post('/', authenticate, createReviewValidator, validate, createReview);

module.exports = router;

