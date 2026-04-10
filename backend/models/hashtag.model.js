import mongoose from "mongoose";

const hashtagSchema = new mongoose.Schema(
	{
		text: {
			type: String,
			required: true,
			unique: true,
		},
		count: {
			type: Number,
			default: 1,
		},
	},
	{ timestamps: true }
);

hashtagSchema.index({ count: -1 });

const Hashtag = mongoose.model("Hashtag", hashtagSchema);

export default Hashtag;
