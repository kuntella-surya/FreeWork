import express from "express";
import { signupUser } from "../controllers/signupController.js";
import { loginUser } from "../controllers/loginController.js";
import { getDashboard } from "../controllers/dashboardcontroller.js";
import { getUserProfile } from "../controllers/getuserprofile.js";
import { updateUserProfile } from "../controllers/updateuserprofile.js";
import { createProfile } from "../controllers/profilecontroller.js";
import { getFreelanceProfile } from "../controllers/getprofile.js";
import { postProject } from "../controllers/Projectcontroller.js";
import { protect } from "../middleware/auth.js";
import { getProject } from "../controllers/getProjectcontroller.js";
import { findWork } from "../controllers/findwork.js";
import upload from "../middleware/upload.js"; 
import Projectpost from "../models/Project.js";
import Proposal from "../models/Proposals.js";
import { PostProposal } from "../controllers/PostProposals.js";
import { getProposals } from "../controllers/getProposals.js";
import { getProfile } from "../controllers/profilecontroller.js";
import { getChatuser } from "../controllers/getChatuser.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import { getSocketInstance } from "../config/setSocketInstsnce.js";
import { sendOtp,verifyOtp } from "../services/service.js";
import mongoose from "mongoose";
import { updateProject } from "../controllers/update.js";
import { deleteProject } from "../controllers/deleteproject.js";
import { getassignedFreelanceProfile } from "../controllers/assignedprofile.js";
// inside assign route

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/send-otp",sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/dashboard", protect, getDashboard);
router.delete("/project/delete/:_id",protect,deleteProject);
router.get("/getassigned/:id",protect,getassignedFreelanceProfile);
router.put("/project/update/:id",protect,updateProject);
router.get("/profile", protect, getUserProfile);
router.get("/cur/:userId",protect,getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.post("/project/postp", protect, postProject);
router.get("/project/getp",protect,getProject);
router.get("/projects/findwork",protect,findWork);
router.post(
  "/create-profile",
  protect,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "coverPic", maxCount: 1 },
    { name: "certificates", maxCount: 10 },
  ]),
  createProfile
);
router.get("/notifications", protect, async (req, res) => {
  console.log(req.user.id)
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(notifications);
});
router.put("/notifications/mark-all-read", protect, async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  res.sendStatus(200);
});

router.post("/proposals/:projectId",protect,PostProposal);
router.get("/proposals/:projectId",protect,getProposals);
// In your routes/routes.js
router.get("/freelance-profile", protect, getFreelanceProfile); // ← this is correct
router.get("/project/:projectId",protect, async (req, res) => {
  try {
    const { projectId } = req.params

    // Fetch project by ID
    const project = await Projectpost.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Fetch all proposals related to this project
    const proposals = await Proposal.find({ projectId })
      .populate("freelancerId", "name email profilePic"); // customize fields as needed
    
    res.status(200).json({
      project,
      proposals,
    });
  } catch (error) {
    console.error("Error fetching project with proposals:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
router.get('/projects/assigned', protect, async (req, res) => {
  try {
    const projects = await Projectpost.find({ assignedTo: req.user.id });
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch assigned projects" });
  }
});

router.get("/user/:otherUserId",protect,async (req,res) =>{
const {otherUserId} = req.params;
const projectd =await Projectpost.findOne({clientId :otherUserId})
res.status(200).json(projectd._id);
})
router.get("/cur/:curid",protect,async(req,res)=>{  
  const cur = await User.findById(req.params.curid);
  console.log("hello:",cur);
  res.json(cur);
})
router.get("/projects/:projectId", protect,async (req, res) => {
  const project = await Projectpost.findById(req.params.projectId);
  res.json({ project });
});
// routes/chat.js
router.get('/unread-count', protect, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const messages = await Message.find({
      senderId: { $ne: currentUserId },
      readBy: { $ne: currentUserId }
    });

    const unreadCountByUser = {};

    for (let msg of messages) {
      const [id1, id2] = msg.roomId.split('_');
      const otherUserId = id1 === currentUserId ? id2 : id1;
      if (!unreadCountByUser[otherUserId]) unreadCountByUser[otherUserId] = 0;
      unreadCountByUser[otherUserId]++;
    }

    res.json({ unreadCounts: unreadCountByUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.put('/markAsRead/:roomId', async (req, res) => {
  const { userId } = req.body;
  const { roomId } = req.params;

  try {
    await Message.updateMany(
      {
        roomId,
        senderId: { $ne: userId }, 
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    res.status(200).json({ message: 'Messages marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Error marking messages as read.' });
  }
});

router.get('/conversations/:userId', protect, async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await Message.find({
      roomId: { $regex: userId }
    });

    const roomMap = {};

    for (const msg of messages) {
      if (!roomMap[msg.roomId]) roomMap[msg.roomId] = [];
      roomMap[msg.roomId].push(msg);
    }

    const result = [];

    for (const [roomId, msgs] of Object.entries(roomMap)) {
      const sortedMsgs = msgs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const lastMsg = sortedMsgs[0];

      const participants = roomId.split('_');
      
      // ✅ Filter out empty strings and the current userId
      const otherUserId = participants.find(id => id && id !== userId);
      
      if (!otherUserId) continue; // skip invalid room

      // ✅ Ensure valid ObjectId before querying
      if (!otherUserId.match(/^[0-9a-fA-F]{24}$/)) continue;

      const unreadCount = msgs.filter(
        m => !m.readBy.includes(userId) && m.senderId !== userId
      ).length;
      
      const otherUser = await User.findById(otherUserId).select('uname profilePicUrl');

      if (!otherUser) continue;

      result.push({
        otherUserId,
        otherUserName: otherUser.uname,
        profilePicUrl: otherUser.profilePicUrl,
        lastMessage: lastMsg.content,
        timestamp: lastMsg.timestamp,
        unreadCount,
      });
    }
   
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching conversations:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Example: GET /api/dashboard/:userId
router.get("/dashboard/:userId", protect,async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId)
    const activeProjects = await Projectpost.countDocuments({
      clientId: userId,
      status: "open", // assuming you use this
    });

    const hired = await Projectpost.countDocuments({
      clientId: userId,
      assignedTo: { $exists: true, $ne: null },
    });

    const notifications = await Notification.countDocuments({
      userId: userId,
      read: false,
    });

    res.json({ activeProjects, hired, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.post('/messages/mark-read', protect, async (req, res) => {
  const { roomId, userId } = req.body;

  try {
    await Message.updateMany(
      {
        roomId,
        senderId: { $ne: userId },
        readBy: { $ne: userId } // not already marked read
      },
      { $addToSet: { readBy: userId } } // add userId to readBy
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error marking messages read:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/charts/:userId',protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    const monthlyProjects = await Projectpost.aggregate([
  {
    $match: {
      clientId: new mongoose.Types.ObjectId(userId),
      createdAt: { $exists: true, $ne: null }
    }
  },
  {
    $group: {
      _id: { $month: "$createdAt" },
      count: { $sum: 1 }
    }
  },
  { $sort: { "_id": 1 } }
]);

    console.log("is:",monthlyProjects)
    // Map month number to names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const fullBarData = Array(12).fill(0); // initialize all months to 0
    monthlyProjects.forEach(item => {
      fullBarData[item._id - 1] = item.count;
    });

    // You can also calculate category-wise distribution for Doughnut chart here:
    const categoryData = await Projectpost.aggregate([
      { $match: { clientId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    const doughnutLabels = categoryData.map(c => c._id);
    const doughnutValues = categoryData.map(c => c.count);

    res.json({
      bar: {
        labels: monthNames,
        data: fullBarData,
      },
      doughnut: {
        labels: doughnutLabels,
        data: doughnutValues,
      }
    });

  } catch (err) {
    console.error("Chart data fetch error:", err);
    res.status(500).json({ error: "Server error while fetching chart data." });
  }
});
// routes/projectRoutes.js
router.post('/project/:projectId/assign', protect, async (req, res) => {
  try {
    const { proposalId } = req.body;
    const projectId = req.params.projectId;

    const project = await Projectpost.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });

    project.assignedTo = proposal.freelancerId;
    project.assignedName = proposal.freelancerName;
    project.status = "completed";
    await project.save();

   const notification = new Notification({
    userId: proposal.freelancerId,
    message: `You have been assigned to project: ${project.title}`,
    projectId: project._id,
    type: "assignment",
  });
  await notification.save();
const io = getSocketInstance();
  io.to(proposal.freelancerId.toString()).emit("newNotification", notification);


    res.status(200).json({ message: "Work assigned", freelancerName: proposal.freelancerName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/chat-users",protect,getChatuser);
export default router;
