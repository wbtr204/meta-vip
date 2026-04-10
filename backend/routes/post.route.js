import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
	commentOnPost,
	createPost,
	deletePost,
	getAllPosts,
	getFollowingPosts,
	getLikedPosts,
	getUserPosts,
	likeUnlikePost,
	searchPosts,
	deleteComment,
	editPost,
	bookmarkPost,
	getBookmarks,
	repostPost,
	getTrendingHashtags,
	getExplorePosts,
	getPost,
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/all", protectRoute, getAllPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/trending", protectRoute, getTrendingHashtags);
router.get("/bookmarks", protectRoute, getBookmarks);
router.get("/search", protectRoute, searchPosts);
router.get("/explore", protectRoute, getExplorePosts);
router.get("/likes/:id", protectRoute, getLikedPosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.get("/:id", protectRoute, getPost);
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.post("/bookmark/:id", protectRoute, bookmarkPost);
router.post("/repost/:id", protectRoute, repostPost);
router.put("/:id", protectRoute, editPost);
router.delete("/comment/:postId/:commentId", protectRoute, deleteComment);
router.delete("/:id", protectRoute, deletePost);

export default router;
