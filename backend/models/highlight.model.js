import mongoose from "mongoose";

const highlightStorySchema = new mongoose.Schema(
	{
		sourceStoryId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Story",
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
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: false }
);

const highlightSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 15,
		},
		coverImage: {
			type: String,
			required: true,
		},
		coverStoryId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Story",
		},
		stories: {
			type: [highlightStorySchema],
			default: [],
		},
	},
	{ timestamps: true }
);

const Highlight = mongoose.model("Highlight", highlightSchema);

export default Highlight;
