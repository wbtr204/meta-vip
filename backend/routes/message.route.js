import express from "express";
import { getMessages, sendMessage, getUsersForSidebar, getConversations, markMessagesAsRead, acceptConversation, rejectConversation } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/read/:id", protectRoute, markMessagesAsRead);
router.post("/accept/:id", protectRoute, acceptConversation);
router.post("/reject/:id", protectRoute, rejectConversation);

export default router;
