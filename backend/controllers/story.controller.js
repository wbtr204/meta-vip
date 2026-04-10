import { v2 as cloudinary } from "cloudinary";
import Story from "../models/story.model.js";
import User from "../models/user.model.js";
import StoryArchive from "../models/storyArchive.model.js";

export const createStory = async (req, res) => {
	try {
		const { mediaUrl } = req.body;
		const userId = req.user._id;

		if (!mediaUrl) {
			return res.status(400).json({ error: "Media is required" });
		}

		let uploadedMediaUrl = mediaUrl;
		if (mediaUrl.startsWith("data:image")) {
			const uploadedResponse = await cloudinary.uploader.upload(mediaUrl, {
                folder: "vibenet_stories",
            });
			uploadedMediaUrl = uploadedResponse.secure_url;
		}

		const newStory = new Story({
			userId,
			mediaUrl: uploadedMediaUrl,
		});

		await newStory.save();
		await StoryArchive.findOneAndUpdate(
			{ userId, sourceStoryId: newStory._id },
			{
				userId,
				sourceStoryId: newStory._id,
				mediaUrl: newStory.mediaUrl,
				mediaType: newStory.mediaType || "image",
				views: newStory.views || [],
				storyCreatedAt: newStory.createdAt || new Date(),
				archivedAt: new Date(),
			},
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);
		res.status(201).json(newStory);
	} catch (error) {
		console.log("Error in createStory controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getStoryFeed = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const following = user.following;

		// Lấy story của chính mình và những người đang theo dõi
		const stories = await Story.find({
			userId: { $in: [userId, ...following] },
		})
			.sort({ createdAt: -1 })
			.populate({
				path: "userId",
				select: "username profileImg fullName",
			});

		// Group stories by userId
		const groupedStories = stories.reduce((acc, story) => {
			const userId = story.userId._id.toString();
			if (!acc[userId]) {
				acc[userId] = {
					user: story.userId,
					stories: [],
				};
			}
			acc[userId].stories.push(story);
			return acc;
		}, {});

		res.status(200).json(Object.values(groupedStories));
	} catch (error) {
		console.log("Error in getStoryFeed controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getArchivedStories = async (req, res) => {
	try {
		const userId = req.user._id;
		const [liveStories, archivedStories] = await Promise.all([
			Story.find({ userId })
				.sort({ createdAt: -1 })
				.populate({
					path: "userId",
					select: "username profileImg fullName",
				}),
			StoryArchive.find({ userId })
				.sort({ storyCreatedAt: -1 })
				.populate({
					path: "userId",
					select: "username profileImg fullName",
				}),
		]);

		const archivedMap = new Map(
			[...liveStories, ...archivedStories].map((story) => [
				(story.sourceStoryId || story._id).toString(),
				{
					...story.toObject(),
					sourceStoryId: story.sourceStoryId || story._id,
				},
			])
		);

		const stories = [...archivedMap.values()].sort(
			(a, b) =>
				new Date(b.storyCreatedAt || b.createdAt || 0).getTime() -
				new Date(a.storyCreatedAt || a.createdAt || 0).getTime()
		);

		res.status(200).json(stories);
	} catch (error) {
		console.log("Error in getArchivedStories controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const viewStory = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const story = await Story.findById(id);
		if (!story) {
			return res.status(404).json({ error: "Story not found" });
		}

		if (!story.views.includes(userId)) {
			story.views.push(userId);
			await story.save();
		}

		res.status(200).json({ message: "Story viewed" });
	} catch (error) {
		console.log("Error in viewStory controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const story = await Story.findById(id);
        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        if (story.userId.toString() !== userId.toString()) {
            return res.status(401).json({ error: "You are not authorized to delete this story" });
        }

        if (story.mediaUrl) {
            const publicId = story.mediaUrl.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`vibenet_stories/${publicId}`);
        }

        await Story.findByIdAndDelete(id);
        res.status(200).json({ message: "Story deleted successfully" });
    } catch (error) {
        console.log("Error in deleteStory controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
