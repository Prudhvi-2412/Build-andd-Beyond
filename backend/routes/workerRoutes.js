const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { 
    getJobs, 
    getJoinCompany, 
    getSettings, 
    getEditProfile, 
    getDashboard, 
    getWorkerById, 
    deleteWorkerRequest,
    createWorkerRequest,
    updateWorkerProfile,
    updateAvailability,
    acceptOffer,
    declineOffer,
    updateJobStatus,
    getOngoingProjects,
    postProjectUpdate,
    markProjectAsCompleted,
    submitProposal,
    updatePassword,
    getMyCompany,
    leaveCompany,
    submitMilestone
} = require('../controllers/workerController');

const { submitWorkerReview, getProjectReviewStatus } = require('../controllers/reviewController');

const isAuthenticated = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

router.get('/workerjobs', isAuthenticated, getJobs);
router.get('/workerjoin_company', isAuthenticated, getJoinCompany);
router.get('/workersettings', isAuthenticated, getSettings);
router.get('/worker_edit', isAuthenticated, getEditProfile); // Protected this route
router.get('/workerdashboard', isAuthenticated, getDashboard);
router.get('/worker/dashboard', isAuthenticated, getDashboard);
router.get('/worker/jobs', isAuthenticated, getJobs);
router.get('/worker/my-company', isAuthenticated, getMyCompany);


router.get('/api/workers/:id', isAuthenticated, getWorkerById);
router.delete('/api/worker-requests/:id', isAuthenticated, deleteWorkerRequest);

router.post('/worker_request/:companyId', isAuthenticated, upload.single("resume"), createWorkerRequest);

router.post('/worker/profile/update', isAuthenticated, upload.any(), updateWorkerProfile);

router.post('/worker/availability', isAuthenticated, updateAvailability);

router.post('/offers/:id/accept', isAuthenticated, acceptOffer);
router.post('/offers/:id/decline', isAuthenticated, declineOffer);

router.post('/jobs/:id/status', isAuthenticated, updateJobStatus);
router.get('/worker/ongoing-projects', isAuthenticated, getOngoingProjects);
router.post('/worker/project-update', isAuthenticated, upload.single('updateImage'), postProjectUpdate);
router.post('/worker/project-complete', isAuthenticated, markProjectAsCompleted);
router.post('/worker/submit-proposal', isAuthenticated, submitProposal);
router.post('/worker/password/update', isAuthenticated, updatePassword);
router.post('/worker/leave-company', isAuthenticated, leaveCompany);
router.post('/worker/submit-milestone', isAuthenticated, upload.single('image'), submitMilestone);

// Review routes
router.post('/worker/review', isAuthenticated, submitWorkerReview);
router.get('/worker/review-status/:projectType/:projectId', isAuthenticated, getProjectReviewStatus);

module.exports = router;