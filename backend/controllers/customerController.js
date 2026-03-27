const {
  Customer,
  Worker,
  ArchitectHiring,
  DesignRequest,
  ConstructionProjectSchema,
  Bid,
  Company,
  FavoriteDesign,
} = require("../models/index");
const { getTargetDate } = require("../utils/helpers");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { findOrCreateChatRoom } = require("./chatController");

const getDashboard = (req, res) => {
  // routed file : customer/customer_dashboard
  res.status(200).json({ view: "customer/customer_dashboard" });
};

const getJobRequestStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id)
      return res.status(401).json({ error: "Unauthorized" });

    const rawArchitectApplications = await ArchitectHiring.find({
      customer: req.user.user_id,
    })
      .select("+milestones +projectUpdates")
      .lean();
    const rawInteriorApplications = await DesignRequest.find({
      customerId: req.user.user_id,
    })
      .select("+milestones +projectUpdates")
      .lean();
    const companyApplications = await ConstructionProjectSchema.find({
      customerId: req.user.user_id,
    }).lean();

    const architectApplications = await Promise.all(
      rawArchitectApplications.map(async (app) => {
        if (app.status === "Accepted" && app.worker) {
          const chatRoom = await findOrCreateChatRoom(app._id, "architect");
          return { ...app, chatId: chatRoom ? chatRoom.roomId : null };
        }
        return app;
      }),
    );

    const interiorApplications = await Promise.all(
      rawInteriorApplications.map(async (app) => {
        if (app.status === "accepted" && app.workerId) {
          const chatRoom = await findOrCreateChatRoom(app._id, "interior");
          return { ...app, chatId: chatRoom ? chatRoom.roomId : null };
        }
        return app;
      }),
    );

    // routed file : customer/Job_Status
    res.status(200).json({
      architectApplications,
      interiorApplications,
      companyApplications,
    });
  } catch (error) {
    console.error("Error fetching job request status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getConstructionCompaniesList = async (req, res) => {
  try {
    const companies = await Company.find({}).lean();

    const companiesWithReviews = await Promise.all(
      companies.map(async (company) => {
        const completedProjects = await ConstructionProjectSchema.find({
          companyId: company._id,
          status: "accepted",
          completionPercentage: 100,
          "customerReview.rating": { $exists: true, $ne: null },
        })
          .select("projectName customerReview completionImages")
          .lean();

        // Calculate average rating
        let averageRating = 0;
        let totalReviews = completedProjects.length;

        if (totalReviews > 0) {
          const sumRatings = completedProjects.reduce((sum, project) => {
            return sum + (project.customerReview?.rating || 0);
          }, 0);
          averageRating = (sumRatings / totalReviews).toFixed(1);
        }

        return {
          ...company,
          completedProjectsWithReviews: completedProjects,
          averageRating: parseFloat(averageRating),
          totalReviews,
        };
      }),
    );

    // routed file : customer/construction_companies_list
    res.status(200).json({ companies: companiesWithReviews, user: req.user });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getArchitects = async (req, res) => {
  try {
    const architects = await Worker.find({ isArchitect: true }).lean();
    // routed file : customer/architect
    res.status(200).json({ architects });
  } catch (error) {
    console.error("Error fetching architects:", error);
    res.status(500).json({ message: "Failed to fetch architects" });
  }
};

const getArchitectForm = (req, res) => {
  const { workerId } = req.query;
  // routed file : customer/architect_form
  res.status(200).json({ workerId });
};

const getOngoingProjects = async (req, res) => {
  try {
    const customerId = req.user.user_id;
    if (!customerId)
      return res
        .status(401)
        .json({ error: "Unauthorized", redirect: "/login" });

    const projects = await ConstructionProjectSchema.find({
      customerId,
      status: "accepted",
    })
      .populate("companyId", "companyName")
      .lean();

    const totalActiveProjects = projects.length;
    const metrics = {
      totalActiveProjects,
      monthlyRevenue: "4.8",
      customerSatisfaction: "4.7",
      projectsOnSchedule: "85",
    };

    const enhancedProjects = projects.map((project) => {
      let completion = 0;
      let currentPhase = "Planning";

      if (project.currentPhase) {
        const phases = [
          "Foundation",
          "Structure",
          "Interior work",
          "Finishing",
        ];
        const phaseIndex = phases.indexOf(project.currentPhase);
        completion = phaseIndex >= 0 ? (phaseIndex + 1) * 25 : 0;
        currentPhase = project.currentPhase;
      }

      completion = project.completionPercentage || completion;

      let targetDate = "Not specified";
      if (project.targetCompletionDate) {
        targetDate = new Date(project.targetCompletionDate).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "short", day: "numeric" },
        );
      } else if (project.projectTimeline && project.createdAt) {
        targetDate = getTargetDate(project.createdAt, project.projectTimeline);
      }

      return {
        ...project,
        completion,
        targetDate,
        currentPhase,
        updates: (project.recentUpdates || []).map((update) => ({
          description: update.updateText || "No description",
          image: update.updateImagePath || "/images/update-default.jpg",
        })),
        siteFilepaths:
          project.siteFilepaths ||
          (project.mainImagePath ? [project.mainImagePath] : []),
        floors: project.floors || [],
        specialRequirements: project.specialRequirements || "None specified",
        accessibilityNeeds: project.accessibilityNeeds || "none",
        energyEfficiency: project.energyEfficiency || "standard",
        companyName: project.companyId
          ? project.companyId.companyName
          : "Not assigned",
      };
    });

    // routed file : customer/ongoing_projects
    res.status(200).json({ projects: enhancedProjects, metrics });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getDesignIdeas = (req, res) => {
  // routed file : customer/design_ideas
  res.status(200).json({ view: "customer/design_ideas" });
};

const getInteriorDesignForm = (req, res) => {
  const { workerId } = req.query;
  // routed file : customer/interiordesign_form
  res.status(200).json({ workerId });
};

const getInteriorDesigners = async (req, res) => {
  try {
    const designers = await Worker.find({ isArchitect: false }).lean();
    // routed file : customer/interior_design
    res.status(200).json({ designers });
  } catch (error) {
    console.error("Error fetching designers:", error);
    res.status(500).json({ message: "Failed to fetch designers" });
  }
};

const getConstructionForm = (req, res) => {
  // routed file : customer/construction_form
  res.status(200).json({ view: "customer/construction_form" });
};

const getBidForm = (req, res) => {
  // routed file : customer/bid_form
  res.status(200).json({ view: "customer/bid_form" });
};

const submitBidForm = async (req, res) => {
  const siteFiles = req.files.siteFiles || [];
  const floorImages = req.files.floorImages || [];
  const siteFilepaths = siteFiles.map((file) => file.path);

  const {
    projectName,
    customerName,
    customerEmail,
    customerPhone,
    projectAddress,
    projectLocation,
    totalArea,
    buildingType,
    estimatedBudget,
    projectTimeline,
    totalFloors,
    specialRequirements,
    accessibilityNeeds,
    energyEfficiency,
    floors,
  } = req.body;

  try {
    if (!req.user || !req.user.user_id) {
      return res
        .status(401)
        .json({ error: "Authentication required to submit a bid request." });
    }

    let parsedFloors = floors || [];
    if (!Array.isArray(parsedFloors)) {
      parsedFloors = Object.values(parsedFloors);
    }

    const finalFloors = parsedFloors.map((floor, index) => ({
      ...floor,
      floorArea: Number(floor.floorArea),
      floorNumber: Number(floor.floorNumber),
      floorImagePath: floorImages[index] ? floorImages[index].path : null,
    }));

    const newBid = new Bid({
      projectName,
      customerId: req.user.user_id,
      customerName,
      customerEmail,
      customerPhone,
      projectAddress,
      projectLocation,
      totalArea: Number(totalArea),
      buildingType,
      estimatedBudget: Number(estimatedBudget) || 0,
      projectTimeline: Number(projectTimeline) || 0,
      totalFloors: Number(totalFloors),
      floors: finalFloors,
      specialRequirements,
      accessibilityNeeds,
      energyEfficiency,
      siteFiles: siteFilepaths,
      status: "open",
      companyBids: [],
    });

    await newBid.save();
    res.status(200).json({
      success: true,
      message: "Bid submitted",
      redirect: "/job_status",
    });
  } catch (error) {
    console.error("Error in submitBidForm:", error);
    res.status(500).json({
      error:
        "Error submitting project request. Please check the fields and try again.",
    });
  }
};

const getSettings = async (req, res) => {
  try {
    const user = await Customer.findById(req.user.user_id).lean();
    // routed file : customer/customer_settings
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getBidSpace = async (req, res) => {
  try {
    const customerId = req.user.user_id;
    const customerBids = await Bid.find({ customerId }).lean();
    // routed file : customer/bid_space
    res.status(200).json({ customerBids, user: req.user });
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const postConstructionForm = async (req, res) => {
  try {
    const {
      projectName,
      customerName,
      customerEmail,
      customerPhone,
      projectAddress,
      projectLocationPincode,
      totalArea,
      buildingType,
      estimatedBudget,
      projectTimeline,
      totalFloors,
      specialRequirements,
      accessibilityNeeds,
      energyEfficiency,
      floors,
    } = req.body;

    const siteFilepaths = req.files ? req.files.map((file) => file.path) : [];

    let parsedFloors = [];
    if (typeof floors === "string") {
      try {
        parsedFloors = JSON.parse(floors);
      } catch (e) {
        console.error("Error parsing floors:", e);
        return res.status(400).json({ error: "Invalid floors data" });
      }
    } else if (Array.isArray(floors)) {
      parsedFloors = floors;
    }

    const newProject = new ConstructionProjectSchema({
      projectName,
      customerName,
      customerEmail,
      customerPhone,
      projectAddress,
      projectLocationPincode,
      totalArea: Number(totalArea),
      buildingType,
      estimatedBudget: Number(estimatedBudget) || 0,
      projectTimeline: Number(projectTimeline) || 0,
      totalFloors: Number(totalFloors),
      floors: parsedFloors,
      specialRequirements,
      accessibilityNeeds,
      energyEfficiency,
      siteFilepaths,
      customerId: req.user ? req.user.user_id : null,
      status: "pending",
    });

    await newProject.save();
    res.status(200).json({ success: true, redirect: "/ongoing_projects" });
  } catch (error) {
    console.error("Error in postConstructionForm:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getFavorites = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const customerId = req.user.user_id;
    const favoritesDoc = await FavoriteDesign.findOne({ customerId }).lean();
    const favorites = favoritesDoc ? favoritesDoc.designs : [];
    res.status(200).json({ favorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Failed to retrieve favorites." });
  }
};

const saveFavoriteDesign = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const customerId = req.user.user_id;
    const { designId, category, title, imageUrl } = req.body;

    if (!designId || !category || !title || !imageUrl) {
      return res
        .status(400)
        .json({ message: "Missing required design fields." });
    }

    const newDesign = { designId, category, title, imageUrl };
    const updatedDoc = await FavoriteDesign.findOneAndUpdate(
      { customerId },
      { $addToSet: { designs: newDesign } },
      { new: true, upsert: true },
    );

    if (!updatedDoc) {
      return res
        .status(500)
        .json({ message: "Failed to create or update favorites document." });
    }

    const addedDesign = updatedDoc.designs.find((d) => d.designId === designId);
    res.status(201).json({
      message: "Design added to favorites!",
      favorite: { ...addedDesign.toObject(), _id: addedDesign.designId },
    });
  } catch (error) {
    console.error("Error saving favorite design:", error);
    res
      .status(500)
      .json({ message: "Failed to save favorite due to a server error." });
  }
};

const removeFavoriteDesign = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const customerId = req.user.user_id;
    const designIdToRemove = req.params.id;

    const result = await FavoriteDesign.updateOne(
      { customerId },
      { $pull: { designs: { designId: designIdToRemove } } },
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return res.status(404).json({
        message: "Favorite list not found or design not in favorites.",
      });
    }

    if (result.modifiedCount === 0 && result.matchedCount === 1) {
      return res
        .status(404)
        .json({ message: "Design not found in favorites array." });
    }

    res.status(200).json({ message: "Favorite design removed successfully." });
  } catch (error) {
    console.error("Error removing favorite design:", error);
    res.status(500).json({ message: "Failed to remove favorite." });
  }
};

const acceptProposal = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const customerId = req.user.user_id;

    let project;

    if (type === "architect") {
      project = await ArchitectHiring.findOne({
        _id: id,
        customer: customerId,
      }).populate("worker");
      if (!project) {
        const err = new Error("Project not found or you are not authorized.");
        err.status = 404;
        return next(err);
      }
      if (project.proposal && project.proposal.price)
        project.finalAmount = project.proposal.price;
      project.status = "Pending Payment"; // Changed from "Accepted" - payment must be completed first
    } else if (type === "interior") {
      const projectToUpdate = await DesignRequest.findOne({
        _id: id,
        customerId: customerId,
      }).populate("workerId");
      if (!projectToUpdate) {
        const err = new Error("Project not found or you are not authorized.");
        err.status = 404;
        return next(err);
      }
      project = projectToUpdate;
      if (project.proposal && project.proposal.price)
        project.finalAmount = project.proposal.price;
      project.status = "pending_payment"; // Changed from "accepted" - payment must be completed first
    } else {
      return res.status(400).json({ error: "Invalid project type." });
    }

    await project.save();

    // Return success with redirect to payment checkout page
    // Customer will be redirected to professional payment page
    res.status(200).json({
      success: true,
      redirect: `/customerdashboard/payment-checkout/${project._id}?type=${type}&payment=deposit`,
      message:
        "Proposal accepted! Please complete the payment to start your project.",
    });
  } catch (error) {
    console.error("Error accepting proposal:", error);
    next(error);
  }
};

const acceptCompanyBid = async (req, res, next) => {
  try {
    const { bidId, companyBidId } = req.params;
    const customerId = req.user.user_id;

    const bid = await Bid.findOne({ _id: bidId, customerId: customerId });
    if (!bid) {
      const err = new Error("Bid not found or you are not authorized.");
      err.status = 404;
      return next(err);
    }

    const companyBid = bid.companyBids.id(companyBidId);
    if (!companyBid) {
      const err = new Error("Company bid not found.");
      err.status = 404;
      return next(err);
    }

    bid.status = "awarded";
    bid.winningBidId = companyBidId;

    const platformFeePercentage = 0.05;
    bid.paymentDetails.totalAmount = companyBid.bidPrice;
    bid.paymentDetails.platformFee =
      companyBid.bidPrice * platformFeePercentage;
    bid.paymentDetails.paymentStatus = "paid";

    const advancePayout = companyBid.bidPrice * 0.2;
    bid.paymentDetails.payouts.push({
      amount: advancePayout,
      status: "pending",
    });

    await UpdateOngoingProjectsSchema(bid, companyBid);
    await bid.save();

    res.status(200).json({ success: true, redirect: "/ongoing_projects" });
  } catch (error) {
    console.error("Error accepting company bid:", error);
    next(error);
  }
};

const UpdateOngoingProjectsSchema = async (bid, companyBid) => {
  const initialStatus = "accepted";
  await ConstructionProjectSchema.create({
    projectName: bid.projectName,
    customerId: bid.customerId,
    companyId: companyBid.companyId,
    customerName: bid.customerName,
    customerEmail: bid.customerEmail,
    customerPhone: bid.customerPhone,
    projectAddress: bid.projectAddress,
    totalArea: bid.totalArea,
    buildingType: bid.buildingType,
    totalFloors: bid.totalFloors,
    projectLocationPincode: bid.projectLocation,
    estimatedBudget: bid.estimatedBudget,
    projectTimeline: bid.projectTimeline,
    floors: bid.floors,
    specialRequirements: bid.specialRequirements,
    accessibilityNeeds: bid.accessibilityNeeds,
    energyEfficiency: bid.energyEfficiency,
    siteFilepaths: bid.siteFiles,
    status: initialStatus,
    completionPercentage: 0,
    additionalImagePaths: [],
    recentUpdates: [],
    proposal: {
      price: companyBid.bidPrice,
      description: "Accepted Bid Price of " + companyBid.bidPrice,
      sentAt: companyBid.bidDate,
    },
    paymentDetails: {
      totalAmount: bid.paymentDetails.totalAmount,
      platformFee: bid.paymentDetails.platformFee,
      amountPaidToCompany: bid.paymentDetails.amountPaidToCompany,
      paymentStatus: bid.paymentDetails.paymentStatus,
      payouts: bid.paymentDetails.payouts,
    },
  });
};

const acceptCompanyProposal = async (req, res) => {
  try {
    const { projectId } = req.params;
    const customerId = req.user.user_id;

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: customerId,
    });
    if (!project || project.status !== "proposal_sent") {
      return res
        .status(404)
        .json({ error: "Project not found or proposal not available." });
    }

    project.status = "accepted";
    const platformFeePercentage = 0.05;
    project.paymentDetails.totalAmount = project.proposal.price;
    project.paymentDetails.platformFee =
      project.proposal.price * platformFeePercentage;
    project.paymentDetails.paymentStatus = "paid";

    const advancePayout = project.proposal.price * 0.2;
    project.paymentDetails.payouts.push({
      amount: advancePayout,
      status: "pending",
    });

    await project.save();
    res.status(200).json({ success: true, redirect: "/ongoing_projects" });
  } catch (error) {
    console.error("Error accepting company proposal:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const rejectCompanyProposal = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { reason } = req.body;
    const customerId = req.user.user_id;

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: customerId,
    });
    if (!project || project.status !== "proposal_sent") {
      return res
        .status(404)
        .json({ error: "Project not found or proposal not available." });
    }

    project.status = "rejected";
    if (reason) {
      project.rejectionReason = reason;
    }

    await project.save();
    res
      .status(200)
      .json({ success: true, message: "Proposal rejected successfully" });
  } catch (error) {
    console.error("Error rejecting company proposal:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const acceptConstructionProposal = async (req, res) => {
  try {
    const { projectId } = req.body;
    const customerId = req.user.user_id;

    const project = await ConstructionProjectSchema.findOne({
      _id: projectId,
      customerId: customerId,
    });

    if (!project || project.status !== "proposal_sent") {
      return res
        .status(404)
        .json({ error: "Project not found or proposal not available." });
    }

    // Update project status to accepted
    project.status = "accepted";
    project.proposalAcceptedAt = new Date();

    await project.save();
    res
      .status(200)
      .json({ success: true, message: "Proposal accepted successfully" });
  } catch (error) {
    console.error("Error accepting construction proposal:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const customerId = req.user.user_id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required." });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    const isSameAsOld = await bcrypt.compare(newPassword, customer.password);
    if (isSameAsOld) {
      return res.status(400).json({ message: "New password cannot be same as current password." });
    }

    customer.password = newPassword;
    await customer.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error while updating password." });
  }
};

const approveMilestone = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { projectType } = req.body;

    let project;
    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    milestone.status = "Approved";
    milestone.approvedAt = new Date();
    await project.save();

    // Automatically release payment for this milestone
    let paymentReleaseInfo = null;
    try {
      const { releaseMilestonePayment } = require("./paymentController");
      const mockReq = {
        body: {
          projectId: projectId,
          projectType: projectType,
          milestonePercentage: milestone.percentage,
        },
      };

      // Create promise to capture payment release response
      const paymentPromise = new Promise((resolve, reject) => {
        const mockRes = {
          json: (data) => {
            console.log("Milestone payment released:", data);
            resolve(data);
          },
          status: (code) => ({
            json: (data) => {
              console.error("Failed to release milestone payment:", data);
              reject(data);
            },
          }),
        };

        releaseMilestonePayment(mockReq, mockRes).catch(reject);
      });

      // Wait for payment release to complete
      paymentReleaseInfo = await paymentPromise;
    } catch (paymentError) {
      console.error("Error in milestone payment release:", paymentError);
      // Don't fail the approval if payment release fails
    }

    // Check if there's a next milestone that needs payment
    const nextMilestone = paymentReleaseInfo?.data?.nextPayment;

    if (nextMilestone && nextMilestone.milestone) {
      // Redirect to payment checkout page for next milestone
      const redirectUrl = `/customerdashboard/payment-checkout/${projectId}?type=${projectType}&payment=milestone&milestone=${nextMilestone.milestone}`;

      res.status(200).json({
        success: true,
        message: `Milestone approved and payment released! Please complete payment for next milestone (${nextMilestone.milestone}%).`,
        redirect: redirectUrl,
        paymentInfo: paymentReleaseInfo?.data,
      });
    } else {
      // No more milestones - project complete
      res.status(200).json({
        success: true,
        message: "Milestone approved and payment released! Project completed.",
        paymentInfo: paymentReleaseInfo?.data,
      });
    }
  } catch (error) {
    console.error("Error approving milestone:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const rejectMilestone = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { projectType, reason } = req.body;

    let project;
    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    milestone.status = "Rejected";
    milestone.rejectedAt = new Date();
    if (reason) milestone.rejectionReason = reason;
    await project.save();

    res.status(200).json({ success: true, message: "Milestone rejected" });
  } catch (error) {
    console.error("Error rejecting milestone:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const requestMilestoneRevision = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { projectType, revisionNotes } = req.body;

    if (!revisionNotes || !revisionNotes.trim()) {
      return res.status(400).json({ error: "Revision notes are required" });
    }

    let project;
    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    // Add to revision history
    if (!milestone.revisionHistory) {
      milestone.revisionHistory = [];
    }
    milestone.revisionHistory.push({
      requestedAt: new Date(),
      notes: revisionNotes,
    });

    milestone.status = "Revision Requested";
    milestone.revisionRequestedAt = new Date();
    milestone.revisionNotes = revisionNotes;

    await project.save();

    res
      .status(200)
      .json({ success: true, message: "Revision request sent to worker" });
  } catch (error) {
    console.error("Error requesting milestone revision:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const reportMilestoneToAdmin = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { projectType, reportReason } = req.body;

    if (!reportReason || !reportReason.trim()) {
      return res.status(400).json({ error: "Report reason is required" });
    }

    let project;
    if (projectType === "architect") {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === "interior") {
      project = await DesignRequest.findById(projectId);
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    milestone.status = "Under Review";
    milestone.reportedToAdminAt = new Date();
    milestone.adminReport = reportReason;

    await project.save();

    // TODO: Send notification to admin
    res
      .status(200)
      .json({
        success: true,
        message: "Milestone reported to admin for review",
      });
  } catch (error) {
    console.error("Error reporting milestone to admin:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Architect Hiring Project Details
const getArchitectHiringDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const project = await ArchitectHiring.findOne({
      _id: projectId,
      customer: req.user.user_id,
    })
      .populate("worker", "name email phone specialization")
      .lean();

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching architect hiring details:", error);
    res.status(500).json({ error: "Failed to fetch project details" });
  }
};

// Get Design Request Details
const getDesignRequestDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const project = await DesignRequest.findOne({
      _id: projectId,
      customerId: req.user.user_id,
    })
      .populate("workerId", "name email phone specialization")
      .lean();

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching design request details:", error);
    res.status(500).json({ error: "Failed to fetch project details" });
  }
};

// Get Payment History for Customer
const getPaymentHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const customerId = req.user.user_id;
    const { Transaction } = require("../models/index");

    // Get all transactions for this customer
    const transactions = await Transaction.find({
      customerId: customerId,
      status: "completed",
    })
      .populate("workerId", "name email")
      .populate("projectId", "projectName")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const totalPaid = transactions
      .filter((t) =>
        ["escrow_hold", "milestone_release"].includes(t.transactionType),
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Get unique projects
    const uniqueProjects = [
      ...new Set(
        transactions.map((t) => t.projectId?._id?.toString()).filter(Boolean),
      ),
    ];
    const totalProjects = uniqueProjects.length;

    // Get pending payments (projects with Accepted status but not all milestones paid)
    const architectProjects = await ArchitectHiring.find({
      customer: customerId,
      status: "Accepted",
    }).lean();

    const interiorProjects = await DesignRequest.find({
      customerId: customerId,
      status: "accepted",
    }).lean();

    let pendingPayments = 0;

    [...architectProjects, ...interiorProjects].forEach((project) => {
      if (project.paymentDetails && project.paymentDetails.milestonePayments) {
        const unpaidMilestones =
          project.paymentDetails.milestonePayments.filter(
            (mp) => !mp.paymentCollected && mp.status === "pending",
          );
        pendingPayments += unpaidMilestones.reduce(
          (sum, mp) => sum + mp.amount,
          0,
        );
      }
    });

    res.json({
      success: true,
      transactions: transactions,
      stats: {
        totalPaid: totalPaid,
        totalProjects: totalProjects,
        pendingPayments: pendingPayments,
      },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment history",
    });
  }
};

module.exports = {
  submitBidForm,
  getDashboard,
  getJobRequestStatus,
  getConstructionCompaniesList,
  getArchitects,
  getArchitectForm,
  getOngoingProjects,
  getDesignIdeas,
  getInteriorDesignForm,
  getInteriorDesigners,
  getConstructionForm,
  getBidForm,
  getSettings,
  getBidSpace,
  postConstructionForm,
  getFavorites,
  saveFavoriteDesign,
  removeFavoriteDesign,
  acceptProposal,
  acceptCompanyBid,
  acceptCompanyProposal,
  acceptConstructionProposal,
  rejectCompanyProposal,
  updatePassword,
  approveMilestone,
  rejectMilestone,
  requestMilestoneRevision,
  reportMilestoneToAdmin,
  getArchitectHiringDetails,
  getDesignRequestDetails,
  getPaymentHistory,
};
