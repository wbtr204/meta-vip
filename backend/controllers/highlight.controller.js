import Highlight from "../models/highlight.model.js";
import Story from "../models/story.model.js";
import StoryArchive from "../models/storyArchive.model.js";
import User from "../models/user.model.js";

const serializeHighlight = (highlight) => {
	const plain = highlight.toObject ? highlight.toObject() : highlight;
	return {
		...plain,
		id: plain._id?.toString?.() || plain.id,
	};
};

const buildStorySnapshots = async (userId, storyIds) => {
	const uniqueStoryIds = [...new Set((storyIds || []).map((id) => id?.toString()).filter(Boolean))];
	if (uniqueStoryIds.length === 0) return [];

	const stories = await Story.find({
		_id: { $in: uniqueStoryIds },
		userId,
	}).sort({ createdAt: 1 });

	const archivedStories = await StoryArchive.find({
		sourceStoryId: { $in: uniqueStoryIds },
		userId,
	}).sort({ storyCreatedAt: 1 });

	const storyMap = new Map(stories.map((story) => [story._id.toString(), story]));
	const archiveMap = new Map(archivedStories.map((story) => [story.sourceStoryId.toString(), story]));

	return uniqueStoryIds
		.map((storyId) => storyMap.get(storyId) || archiveMap.get(storyId))
		.filter(Boolean)
		.map((story) => ({
			sourceStoryId: story.sourceStoryId || story._id,
			mediaUrl: story.mediaUrl,
			mediaType: story.mediaType || "image",
			createdAt: story.storyCreatedAt || story.createdAt,
		}));
};

export const getUserHighlights = async (req, res) => {
	try {
		const { username } = req.params;
		const user = await User.findOne({ username }).select("_id username fullName profileImg");
		if (!user) return res.status(404).json({ error: "User not found" });

		const highlights = await Highlight.find({ userId: user._id })
			.sort({ createdAt: -1 })
			.populate("userId", "username fullName profileImg");

		res.status(200).json(highlights.map(serializeHighlight));
	} catch (error) {
		console.log("Error in getUserHighlights: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const createHighlight = async (req, res) => {
	try {
		const { title, storyIds, coverStoryId } = req.body;
		const userId = req.user._id;

		if (!title || !title.trim()) {
			return res.status(400).json({ error: "Title is required" });
		}

		const trimmedTitle = title.trim().slice(0, 15);
		const stories = await buildStorySnapshots(userId, storyIds);

		if (stories.length === 0) {
			return res.status(400).json({ error: "Please select at least one story" });
		}

		const coverStory = stories.find((story) => story.sourceStoryId?.toString() === coverStoryId?.toString()) || stories[0];

		const newHighlight = await Highlight.create({
			userId,
			title: trimmedTitle,
			coverImage: coverStory.mediaUrl,
			coverStoryId: coverStory.sourceStoryId,
			stories,
		});

		await newHighlight.populate("userId", "username fullName profileImg");

		res.status(201).json(serializeHighlight(newHighlight));
	} catch (error) {
		console.log("Error in createHighlight: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateHighlight = async (req, res) => {
	try {
		const { id } = req.params;
		const { title, storyIds, coverStoryId } = req.body;
		const userId = req.user._id;

		const highlight = await Highlight.findById(id);
		if (!highlight) return res.status(404).json({ error: "Highlight not found" });
		if (highlight.userId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You are not authorized to edit this highlight" });
		}

		if (typeof title === "string" && title.trim()) {
			highlight.title = title.trim().slice(0, 15);
		}

		if (Array.isArray(storyIds) && storyIds.length > 0) {
			let stories = await buildStorySnapshots(userId, storyIds);
			if (stories.length === 0) {
				const selectedStoryIds = new Set(storyIds.map((storyId) => storyId?.toString()).filter(Boolean));
				stories = (highlight.stories || []).filter((story) => {
					const sourceStoryId = story.sourceStoryId ? story.sourceStoryId.toString() : null;
					return sourceStoryId ? selectedStoryIds.has(sourceStoryId) : false;
				});
			}

			if (stories.length === 0) {
				return res.status(400).json({ error: "Please select at least one story" });
			}

			highlight.stories = stories;

			const coverStory = stories.find((story) => story.sourceStoryId?.toString() === coverStoryId?.toString()) || stories[0];
			highlight.coverImage = coverStory.mediaUrl;
			highlight.coverStoryId = coverStory.sourceStoryId;
		}

		await highlight.save();
		await highlight.populate("userId", "username fullName profileImg");

		res.status(200).json(serializeHighlight(highlight));
	} catch (error) {
		console.log("Error in updateHighlight: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const deleteHighlight = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const highlight = await Highlight.findById(id);
		if (!highlight) return res.status(404).json({ error: "Highlight not found" });
		if (highlight.userId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You are not authorized to delete this highlight" });
		}

		await Highlight.findByIdAndDelete(id);
		res.status(200).json({ message: "Highlight deleted successfully" });
	} catch (error) {
		console.log("Error in deleteHighlight: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
