const express = require('express');
const router = express.Router();
const { submitArchitect, submitDesignRequest, submitConstructionForm, getProjects, getProjectById, getEditProject, updateProject, submitBid, acceptBid, declineBid, acceptWorkerRequest, rejectWorkerRequest, approveMilestone, requestMilestoneRevision, payMilestone, submitProjectReview, getProjectsWithUnviewedCustomerMessages, markCustomerMessagesViewed, getProjectsWithUnviewedCompanyMessages, markCompanyMessagesViewed } = require('../controllers/projectController');

const isAuthenticated = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

router.post('/architect_submit', isAuthenticated, upload.array('referenceImages', 10), submitArchitect);
router.post('/design_request', isAuthenticated, upload.any(), submitDesignRequest);
router.post('/construction_form', isAuthenticated, upload.any(), submitConstructionForm);
router.get('/api/projects', getProjects);
router.get('/api/projects/:id', getProjectById);
router.get('/edit-project/:id', isAuthenticated, getEditProject);
router.post('/projects/update', upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'additionalImages', maxCount: 10 }, { name: 'completionImages', maxCount: 10 }, { name: 'updateImages', maxCount: 1 }]), updateProject);
router.post('/customer/submit-bid', isAuthenticated, submitBid);
router.post('/customer/accept-bid', isAuthenticated, acceptBid);
router.post('/customer/decline-bid', isAuthenticated, declineBid);

router.post('/customer/approve-milestone', isAuthenticated, approveMilestone);
router.post('/customer/request-milestone-revision', isAuthenticated, requestMilestoneRevision);
router.post('/customer/pay-milestone', isAuthenticated, payMilestone);

router.get('/company/unviewed-customer-messages', isAuthenticated, getProjectsWithUnviewedCustomerMessages);
router.post('/company/mark-messages-viewed/:projectId', isAuthenticated, markCustomerMessagesViewed);
router.get('/customer/unviewed-company-messages', isAuthenticated, getProjectsWithUnviewedCompanyMessages);
router.post('/customer/mark-messages-viewed/:projectId', isAuthenticated, markCompanyMessagesViewed);
router.post('/customer/submit-project-review', isAuthenticated, submitProjectReview);

router.post('/company/worker-request/accept', isAuthenticated, acceptWorkerRequest);
router.post('/company/worker-request/reject', isAuthenticated, rejectWorkerRequest);

module.exports = router;