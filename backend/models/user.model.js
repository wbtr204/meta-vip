import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
		},
		fullName: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
			minLength: 6,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		followers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		following: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		followRequests: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		isPrivate: {
			type: Boolean,
			default: false,
		},
		profileImg: {
			type: String,
			default: "",
		},
		coverImg: {
			type: String,
			default: "",
		},
		bio: {
			type: String,
			default: "",
		},

		link: {
			type: String,
			default: "",
		},
		likedPosts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Post",
			},
		],
		bookmarks: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Post",
			},
		],
		role: {
			type: String,
			enum: ["user", "admin", "moderator"],
			default: "user",
		},
		isBanned: {
			type: Boolean,
			default: false,
		},
		normalizedFullName: {
			type: String,
			default: "",
		},
		department: {
			type: String,
			default: "CNTT",
		},
		interests: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true }
);

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ normalizedFullName: 1 }); // Đánh index trường đã normalize để tìm kiếm siêu tốc

userSchema.pre("save", function (next) {
	if (this.isModified("fullName")) {
		// Kỹ thuật Normalization: Loại bỏ dấu tiếng Việt, chuyển về lowercase tĩnh
		this.normalizedFullName = this.fullName
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "") // Xóa các dấu
			.replace(/đ/g, "d").replace(/Đ/g, "D") // Xử lý chữ Đ
			.toLowerCase();
	}
	next();
});

const User = mongoose.model("User", userSchema);

export default User;
