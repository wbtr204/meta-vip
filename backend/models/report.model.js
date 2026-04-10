import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
	{
		reporter: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		post: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Post",
			required: true,
		},
		reason: {
			type: String,
			required: true,
			enum: ["Spam", "Toxic", "Harassment", "Inappropriate", "Other"],
		},
		details: {
			type: String,
			default: "",
		},
		status: {
			type: String,
			enum: ["pending", "resolved", "dismissed"],
			default: "pending",
		},
		actionTaken: {
			type: String,
			default: "",
		},
	},
	{ timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
