import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
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
		createdAt: {
			type: Date,
			default: Date.now,
			index: { expires: "24h" }, // TTL Index: Tự động xóa sau 24h
		},
	},
	{ timestamps: true }
);

const Story = mongoose.model("Story", storySchema);

export default Story;
