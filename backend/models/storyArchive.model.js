import mongoose from "mongoose";

const storyArchiveSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		sourceStoryId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		mediaUrl: {
			type: String,
			required: true,
		},
		mediaType: {
			type: String,
			enum: ["image", "video"],
			default: "image",
		},
		views: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		storyCreatedAt: {
			type: Date,
			required: true,
		},
		archivedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

storyArchiveSchema.index({ userId: 1, sourceStoryId: 1 }, { unique: true });

const StoryArchive = mongoose.model("StoryArchive", storyArchiveSchema);

export default StoryArchive;
