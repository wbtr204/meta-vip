import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { 
	followUnfollowUser, 
	getSuggestedUsers, 
	getUserProfile, 
	updateUser, 
	searchUsers,
	getUserFollowers,
	getUserFollowing,
	getUserFriends,
	acceptFollowRequest,
	rejectFollowRequest
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.get("/search", protectRoute, searchUsers);
router.get("/followers/:id", protectRoute, getUserFollowers);
router.get("/following/:id", protectRoute, getUserFollowing);
router.get("/friends/:id", protectRoute, getUserFriends);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post("/accept-request/:id", protectRoute, acceptFollowRequest);
router.post("/reject-request/:id", protectRoute, rejectFollowRequest);
router.post("/update", protectRoute, updateUser);

export default router;
