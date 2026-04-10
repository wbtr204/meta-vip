import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createHighlight, deleteHighlight, getUserHighlights, updateHighlight } from "../controllers/highlight.controller.js";

const router = express.Router();

router.get("/user/:username", protectRoute, getUserHighlights);
router.post("/", protectRoute, createHighlight);
router.put("/:id", protectRoute, updateHighlight);
router.delete("/:id", protectRoute, deleteHighlight);

export default router;
