import express from "express";
import { protectRoute, adminRoute } from "../middleware/protectRoute.js";
import { 
    getDashboardStats, 
    getAllUsers, 
    updateUserStatus, 
    deleteContent,
    getReports,
    resolveReport,
    getModerationPosts,
    reviewModerationPost,
    getAuditLogs,
    deleteUser,
    exportData,
    getSystemConfig,
    updateSystemConfig,
    toggleEmergencyMode
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/stats", protectRoute, adminRoute, getDashboardStats);
router.get("/users", protectRoute, adminRoute, getAllUsers);
router.get("/reports", protectRoute, adminRoute, getReports);
router.get("/moderation/posts", protectRoute, adminRoute, getModerationPosts);
router.get("/logs", protectRoute, adminRoute, getAuditLogs);
router.get("/export", protectRoute, adminRoute, exportData);
router.get("/config", protectRoute, adminRoute, getSystemConfig);
router.patch("/config", protectRoute, adminRoute, updateSystemConfig);
router.post("/emergency", protectRoute, adminRoute, toggleEmergencyMode);
router.patch("/users/:userId", protectRoute, adminRoute, updateUserStatus);
router.patch("/resolve-report/:reportId", protectRoute, adminRoute, resolveReport);
router.patch("/moderation/posts/:postId", protectRoute, adminRoute, reviewModerationPost);
router.delete("/users/:userId", protectRoute, adminRoute, deleteUser);
router.delete("/content/:postId", protectRoute, adminRoute, deleteContent);

export default router;
