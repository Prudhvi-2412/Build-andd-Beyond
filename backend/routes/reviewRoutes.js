const express = require('express');
const router = express.Router();
const { submitCustomerReview, submitWorkerReview, getProjectReviewStatus } = require('../controllers/reviewController');
const auth = require('../middlewares/auth');
const isAuthenticated = require('../middlewares/auth');

// Route for customer to submit a review for a worker
router.post('/customer/review', auth, submitCustomerReview);

// Route for worker to submit a review for a customer
router.post('/worker/review', isAuthenticated, submitWorkerReview);

// Route to get the review status of a project
router.get('/project-review-status/:projectType/:projectId', getProjectReviewStatus);

module.exports = router;
