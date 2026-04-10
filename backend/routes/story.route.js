import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createStory, getStoryFeed, getArchivedStories, viewStory, deleteStory } from "../controllers/story.controller.js";

const router = express.Router();

router.get("/feed", protectRoute, getStoryFeed);
router.get("/archive", protectRoute, getArchivedStories);
router.post("/create", protectRoute, createStory);
router.post("/view/:id", protectRoute, viewStory);
router.delete("/:id", protectRoute, deleteStory);

export default router;
