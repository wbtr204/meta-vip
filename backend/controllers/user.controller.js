import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

// models
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const getUserProfile = async (req, res) => {
	const { username } = req.params;

	try {
		const user = await User.findOne({ username }).select("-password");
		if (!user) return res.status(404).json({ message: "User not found" });

		// Calculate mutual friends count (Intersection of followers and following)
		const followersSet = new Set(user.followers.map((id) => id.toString()));
		const friendsCount = user.following.filter((id) => followersSet.has(id.toString())).length;

		res.status(200).json({ ...user._doc, friendsCount });
	} catch (error) {
		console.log("Error in getUserProfile: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const followUnfollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString()) {
			return res.status(400).json({ error: "You can't follow/unfollow yourself" });
		}

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		const isFollowing = currentUser.following.includes(id);
		const isRequested = userToModify.followRequests.some(reqId => reqId.toString() === req.user._id.toString());

		if (isFollowing) {
			// Unfollow logic
			userToModify.followers = userToModify.followers.filter(fId => fId.toString() !== req.user._id.toString());
			currentUser.following = currentUser.following.filter(fId => fId.toString() !== id.toString());
			
			await Promise.all([userToModify.save(), currentUser.save()]);
			res.status(200).json({ message: "Đã bỏ theo dõi" });
		} else {
			if (userToModify.isPrivate) {
				if (isRequested) {
					// Cancel request
					userToModify.followRequests = userToModify.followRequests.filter(reqId => reqId.toString() !== req.user._id.toString());
					await userToModify.save();
					await Notification.findOneAndDelete({ from: req.user._id, to: id, type: "follow_request" });
					res.status(200).json({ message: "Đã hủy yêu cầu theo dõi" });
				} else {
					// Send follow request
					userToModify.followRequests.push(req.user._id);
					await userToModify.save();

					// Avoid duplicate notifications
					const existingNotif = await Notification.findOne({
						from: req.user._id,
						to: id,
						type: "follow_request"
					});

					if (!existingNotif) {
						const newNotification = new Notification({
							type: "follow_request",
							from: req.user._id,
							to: id,
						});
						await newNotification.save();

						const receiverSocketId = getReceiverSocketId(id);
						if (receiverSocketId) {
							io.to(receiverSocketId).emit("newNotification", newNotification);
						}
					}
					res.status(200).json({ message: "Đã gửi yêu cầu theo dõi" });
				}
			} else {
				// Normal Follow
				userToModify.followers.push(req.user._id);
				currentUser.following.push(id);
				
				const newNotification = new Notification({
					type: "follow",
					from: req.user._id,
					to: id,
				});

				await Promise.all([userToModify.save(), currentUser.save(), newNotification.save()]);

				const receiverSocketId = getReceiverSocketId(id);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("newNotification", newNotification);
				}
				res.status(200).json({ message: "Đã theo dõi thành công" });
			}
		}
	} catch (error) {
		console.log("Error in followUnfollowUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getSuggestedUsers = async (req, res) => {
	try {
		const userId = req.user._id;

		const currentUser = await User.findById(userId).select("following department interests");

		// Algorithm: 
		// 1. Same department (priority 1)
		// 2. Same interests (priority 2)
		// 3. Random pool (fallback)
		
		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId, $nin: currentUser.following },
                    isBanned: false
				},
			},
            {
                $addFields: {
                    score: {
                        $add: [
                            { $cond: [{ $eq: ["$department", currentUser.department] }, 10, 0] },
                            { $size: { $setIntersection: [{ $ifNull: ["$interests", []] }, currentUser.interests || []] } }
                        ]
                    }
                }
            },
            { $sort: { score: -1, createdAt: -1 } },
			{ $limit: 10 },
		]);

		const suggestedUsers = users.slice(0, 5);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		console.log("Error in getSuggestedUsers: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const updateUser = async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link, isPrivate, department, interests } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		if (profileImg) {
			if (user.profileImg) {
				// https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
				await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profileImg);
			profileImg = uploadedResponse.secure_url;
		}

		if (coverImg) {
			if (user.coverImg) {
				await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(coverImg);
			coverImg = uploadedResponse.secure_url;
		}

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.isPrivate = isPrivate !== undefined ? isPrivate : user.isPrivate;
		user.department = department || user.department;
		user.interests = interests || user.interests;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		// password should be null in response
		user.password = null;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getUserFollowers = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id).populate("followers", "username fullName profileImg");
		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user.followers);
	} catch (error) {
		console.log("Error in getUserFollowers: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getUserFollowing = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id).populate("following", "username fullName profileImg");
		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user.following);
	} catch (error) {
		console.log("Error in getUserFollowing: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getUserFriends = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id);
		if (!user) return res.status(404).json({ error: "User not found" });

		const followersSet = new Set(user.followers.map((id) => id.toString()));
		const mutualFriendsIds = user.following.filter((id) => followersSet.has(id.toString()));

		const friends = await User.find({ _id: { $in: mutualFriendsIds } }).select("username fullName profileImg");

		res.status(200).json(friends);
	} catch (error) {
		console.log("Error in getUserFriends: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const searchUsers = async (req, res) => {
	try {
		const { q } = req.query;
		if (!q) return res.status(400).json({ error: "Query is required" });

		const users = await User.find({
			$or: [
				{ username: { $regex: q, $options: "i" } },
				{ fullName: { $regex: q, $options: "i" } },
			],
		}).select("-password").limit(10);

		res.status(200).json(users);
	} catch (error) {
		console.log("Error in searchUsers: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const acceptFollowRequest = async (req, res) => {
	try {
		const { id: requesterId } = req.params;
		const userId = req.user._id;

		const user = await User.findById(userId);
		const requester = await User.findById(requesterId);

		if (!user || !requester) return res.status(404).json({ error: "Người dùng không tồn tại" });

		const hasRequest = user.followRequests.some(id => id.toString() === requesterId.toString());

		if (!hasRequest) {
			return res.status(400).json({ error: "Không tìm thấy yêu cầu theo dõi" });
		}

		// Update Recipient (user)
		user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId.toString());
		user.followers.push(requesterId);

		// Update Requester
		requester.following.push(userId);

		// Create acceptance notification
		const newNotification = new Notification({
			type: "follow_accept",
			from: userId,
			to: requesterId,
		});

		// Remove the follow_request notification
		await Notification.findOneAndDelete({
			from: requesterId,
			to: userId,
			type: "follow_request"
		});

		await Promise.all([user.save(), requester.save(), newNotification.save()]);

		const receiverSocketId = getReceiverSocketId(requesterId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newNotification", newNotification);
		}

		res.status(200).json({ message: "Đã chấp nhận yêu cầu theo dõi" });
	} catch (error) {
		console.log("Error in acceptFollowRequest: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const rejectFollowRequest = async (req, res) => {
	try {
		const { id: requesterId } = req.params;
		const userId = req.user._id;

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

		user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId.toString());
		
		// Remove the follow_request notification
		await Notification.findOneAndDelete({
			from: requesterId,
			to: userId,
			type: "follow_request"
		});

		await user.save();

		res.status(200).json({ message: "Đã xóa yêu cầu theo dõi" });
	} catch (error) {
		console.log("Error in rejectFollowRequest: ", error.message);
		res.status(500).json({ error: error.message });
	}
};
