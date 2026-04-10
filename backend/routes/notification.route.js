import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { 
    deleteNotifications, 
    deleteReadNotifications,
    getNotifications, 
    markNotificationsAsRead, 
    deleteNotification,
    getUnreadCount
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.get("/unread-count", protectRoute, getUnreadCount);
router.patch("/read", protectRoute, markNotificationsAsRead);
router.delete("/read", protectRoute, deleteReadNotifications);
router.delete("/", protectRoute, deleteNotifications);
router.delete("/:id", protectRoute, deleteNotification);

export default router;
