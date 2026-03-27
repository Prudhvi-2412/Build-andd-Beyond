const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getDashboard,
  getOngoingProjects,
  getProjectRequests,
  updateProjectStatusController,
  getHiring,
  getSettings,
  getBids,
  getCompanyRevenue,
  createHireRequest,
  updateCompanyProfile,
  handleWorkerRequest,
  submitBidController,
  submitProjectProposal,
  getEmployees,
  updatePassword,
  uploadPlatformFeeInvoice,
} = require("../controllers/companyController");
const isAuthenticated = require("../middlewares/auth");
const { upload: cloudUpload } = require("../middlewares/upload");

// Create a Multer instance for handling FormData
const upload = multer();

router.get('/companydashboard', isAuthenticated, getDashboard);
router.get('/companyongoing_projects', isAuthenticated, getOngoingProjects);
router.get('/project_requests', isAuthenticated, getProjectRequests);
router.patch('/projects/:projectId/:status', isAuthenticated, updateProjectStatusController);
router.get('/companyhiring', isAuthenticated, getHiring);

// Add upload.any() middleware to parse FormData
router.post(
  "/companytoworker",
  isAuthenticated,
  upload.any(),
  createHireRequest,
);

router.get("/companysettings", isAuthenticated, getSettings);
router.get("/companybids", isAuthenticated, getBids);
router.get("/companyrevenue", isAuthenticated, getCompanyRevenue);
router.get("/my-employees", isAuthenticated, getEmployees);
router.get("/revenue_form", isAuthenticated, (req, res) => {
  res.status(200).json({ view: "company/revenue_form" });
});
router.patch(
  "/worker-request/:requestId",
  isAuthenticated,
  handleWorkerRequest,
);
router.post(
  "/update-company-profile",
  isAuthenticated,
  upload.any(),
  updateCompanyProfile,
);
router.post("/submit-bid", isAuthenticated, submitBidController);
router.post("/company/submit-proposal", isAuthenticated, submitProjectProposal);
router.post("/company/password/update", isAuthenticated, updatePassword);
router.post("/company/platform-fee-invoice", isAuthenticated, cloudUpload.single('invoice'), uploadPlatformFeeInvoice);

module.exports = router;
