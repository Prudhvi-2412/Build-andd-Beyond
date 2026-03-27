const express = require("express");
const router = express.Router();

const {
  getAdminDashboard,
  deleteCustomer,
  deleteCompany,
  deleteWorker,
  deleteArchitectHiring,
  deleteConstructionProject,
  deleteDesignRequest,
  deleteBid,
  deleteJobApplication,
  getCustomerDetail,
  getCustomerFullDetail,
  getCompanyDetail,
  getCompanyFullDetail,
  getWorkerDetail,
  getWorkerFullDetail,
  getArchitectHiringDetail,
  getArchitectHiringFullDetail,
  getConstructionProjectDetail,
  getConstructionProjectFullDetail,
  getDesignRequestDetail,
  getDesignRequestFullDetail,
  getBidDetail,
  getJobApplicationDetail,
  getAdminRevenue,
  getPlatformRevenueIntelligence,
  getRedisCacheStatsAdmin,
  resetRedisCacheStatsAdmin,
} = require("../controllers/adminController");
const {
  getAdminAnalytics,
} = require("../controllers/adminanalyticsController");

const {
  getSettings,
  updateSettings
} = require("../controllers/adminSettingsController");

const authadmin = require("../middlewares/authadmin");

// Admin login route
router.post("/admin/login", authadmin);

// Admin session verification route
router.get("/admin/verify-session", authadmin, (req, res) => {
  res.json({ authenticated: true, role: req.admin?.role || "admin" });
});

// Admin logout route
router.post("/admin/logout", (req, res) => {
  res.clearCookie("admin_token", { path: "/" });
  res.json({ message: "Logged out successfully" });
});

// Admin dashboard route (protected)
router.get("/admindashboard", authadmin, getAdminDashboard);
router.get("/admin/analytics", authadmin, getAdminAnalytics);

// Admin revenue analytics route (protected)
router.get("/admin/revenue", authadmin, getAdminRevenue);
router.get("/admin/revenue/platform-intelligence", authadmin, getPlatformRevenueIntelligence);
router.get("/admin/cache/redis-stats", authadmin, getRedisCacheStatsAdmin);
router.post("/admin/cache/redis-stats/reset", authadmin, resetRedisCacheStatsAdmin);

// Admin System Settings routes
router.get("/admin/settings", authadmin, getSettings);
router.put("/admin/settings", authadmin, updateSettings);

// Delete routes
router.delete("/admin/delete-customer/:id", authadmin, deleteCustomer);
router.delete("/admin/delete-company/:id", authadmin, deleteCompany);
router.delete("/admin/delete-worker/:id", authadmin, deleteWorker);
router.delete("/admin/delete-architectHiring/:id", authadmin, deleteArchitectHiring);
router.delete("/admin/delete-constructionProject/:id", authadmin, deleteConstructionProject);
router.delete("/admin/delete-designRequest/:id", authadmin, deleteDesignRequest);
router.delete("/admin/delete-bid/:id", authadmin, deleteBid);
router.delete("/admin/delete-jobApplication/:id", authadmin, deleteJobApplication);

// Detail view routes
router.get("/admin/customer/:id", authadmin, getCustomerDetail);
router.get("/admin/customers/:customerId/full", authadmin, getCustomerFullDetail);
router.get("/admin/companies/:companyId/full", authadmin, getCompanyFullDetail);
router.get("/admin/workers/:workerId/full", authadmin, getWorkerFullDetail);
router.get("/admin/company/:id", authadmin, getCompanyDetail);
router.get("/admin/worker/:id", authadmin, getWorkerDetail);
router.get("/admin/architect-hirings/:projectId/full", authadmin, getArchitectHiringFullDetail);
router.get("/admin/architect-hiring/:id", authadmin, getArchitectHiringDetail);
router.get("/admin/construction-project/:id", authadmin, getConstructionProjectDetail);
router.get("/admin/construction-projects/:projectId/full", authadmin, getConstructionProjectFullDetail);
router.get("/admin/design-requests/:requestId/full", authadmin, getDesignRequestFullDetail);
router.get("/admin/design-request/:id", authadmin, getDesignRequestDetail);
router.get("/admin/bid/:id", authadmin, getBidDetail);
router.get("/admin/job-application/:id", authadmin, getJobApplicationDetail);

module.exports = router;
