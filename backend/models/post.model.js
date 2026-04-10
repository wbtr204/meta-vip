import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		text: {
			type: String,
		},
		imgs: [
			{
				type: String,
			},
		],
		location: {
			type: String,
		},
		hashtags: [
			{
				type: String,
			},
		],
		reactions: [
			{
				user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
				type: { type: String, default: "like" }, // like, love, haha, wow, sad, angry
			},
		],
		comments: [
			{
				text: { type: String, required: true },
				user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
				parentId: { type: mongoose.Schema.Types.ObjectId }, // Để hỗ trợ bình luận lồng nhau (không Ref trực tiếp vào subdocument)
				createdAt: { type: Date, default: Date.now },
			},
		],
		video: {
			type: String,
		},
		repostOf: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Post",
		},
		reposts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		moderation: {
			status: {
				type: String,
				enum: ["approved", "flagged"],
				default: "approved",
			},
			reasons: [
				{
					type: String,
				},
			],
			score: {
				type: Number,
				default: 0,
			},
			autoFlagged: {
				type: Boolean,
				default: false,
			},
			reviewedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
			reviewedAt: {
				type: Date,
			},
		},
	},
	{ timestamps: true }
);

postSchema.index({ user: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ text: "text" });
postSchema.index({ hashtags: 1 });
postSchema.index({ repostOf: 1 });
postSchema.index({ "moderation.status": 1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
