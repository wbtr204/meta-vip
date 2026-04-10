import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
	{
		adminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true, 
		},
		action: {
			type: String,
			required: true, // "ban", "unban", "deletePost", "changeRole", "maintenanceMode"
		},
		targetId: {
			type: mongoose.Schema.Types.ObjectId,
			required: false,
		},
		targetType: {
			type: String,
			required: false, // "User", "Post", "System"
		},
		details: {
			type: String,
			default: "",
		},
	},
	{ timestamps: true }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
