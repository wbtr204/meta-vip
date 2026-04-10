const fs = require('fs');

const file = 'backend/controllers/post.controller.js';
const content = `import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Hashtag from "../models/hashtag.model.js";
import { v2 as cloudinary } from "cloudinary";
import { extractKeywords } from "../utils/keywordExtractor.js";
import { formatModerationReasons, moderateContent } from "../utils/contentModeration.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

const MODERATION_APPROVED = "approved";
const MODERATION_FLAGGED = "flagged";

const getDocId = (value) => value?._id?.toString?.() || value?.toString?.() || "";

const isApprovedPost = (post) => !post?.moderation?.status || post.moderation.status === MODERATION_APPROVED;

const isVisibleToViewer = (post, viewer, { allowModeratedForOwner = false } = {}) => {
	if (!post) return false;

	const viewerId = getDocId(viewer);
	const postOwnerId = getDocId(post.user);
	const viewerIsOwner = viewerId && postOwnerId && viewerId === postOwnerId;
	const viewerIsAdmin = viewer?.role === "admin" || viewer?.email === "admin@gmail.com";

	if (viewerIsAdmin) return true;
	if (allowModeratedForOwner && viewerIsOwner) return true;
	if (!isApprovedPost(post)) return false;

	const repostStatus = post.repostOf?.moderation?.status;
	if (post.repostOf && repostStatus && repostStatus !== MODERATION_APPROVED) {
		return false;
	}

	return true;
};

const filterVisiblePosts = (posts = [], viewer, options) => posts.filter((post) => isVisibleToViewer(post, viewer, options));

const buildModerationPayload = (moderation) => ({
	status: moderation.flagged ? MODERATION_FLAGGED : MODERATION_APPROVED,
	reasons: moderation.reasons,
	score: moderation.score,
	autoFlagged: moderation.flagged,
});

const PUBLIC_POST_FILTER = {
	$or: [{ "moderation.status": { $exists: false } }, { "moderation.status": MODERATION_APPROVED }],
};

export const createPost = async (req, res) => {
	try {
		const { text, imgs, video, location } = req.body;
		const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

		if (!text && (!imgs || imgs.length === 0) && !video) {
			return res.status(400).json({ error: "Post must have text, image, or video" });
		}

		const moderation = moderateContent([text, location].filter(Boolean).join(" "));
		if (moderation.blocked) {
			return res.status(400).json({
				error: \`Bài viết bị chặn do kiểm duyệt: \${formatModerationReasons(moderation.reasons).join(", ")}\`,
			});
		}

		const uploadResource = async (resource, resourceType = "image") => {
			if (!resource) return null;
            const uploaded = await cloudinary.uploader.upload(resource, { resource_type: resourceType });
            return uploaded.secure_url;
        };

        // Upload multiple images in parallel
        const uploadedImgs = imgs?.length > 0 
            ? await Promise.all(imgs.map(img => uploadResource(img))) 
            : [];
            
        const uploadedVideo = await uploadResource(video, "video");

        // Extract hashtags
        const extractedHashtags = text ? text.match(/#\\w+/g)?.map(tag => tag.toLowerCase()) || [] : [];

        const newPost = await Post.create({
            user: userId,
            text,
            imgs: uploadedImgs,
            video: uploadedVideo,
            location,
            hashtags: extractedHashtags,
            moderation: buildModerationPayload(moderation),
        });

		if (extractedHashtags.length > 0 || text) {
            const allKeywords = [...new Set([...extractedHashtags, ...extractKeywords(text)])];
            
            if (allKeywords.length > 0) {
                await Promise.all(
                    allKeywords.map(async (tag) => {
                        const cleanTag = tag.replace('#', '').toLowerCase();
                        if (cleanTag.length > 2) {
                            await Hashtag.updateOne(
                                { text: cleanTag }, 
                                { $inc: { count: 1 } }, 
                                { upsert: true }
                            );
                        }
                    })
                );
            }
		}

        res.status(201).json(newPost);
    } catch (error) {
        console.error("Error in createPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (post.user.toString() !== userId.toString()) {
            return res.status(401).json({ error: "Unauthorized to delete this post" });
        }

        const destroyResource = async (url, resourceType = "image") => {
            if (!url) return;
            const resourceId = url.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(resourceId, { resource_type: resourceType });
        };

        if (post.imgs && post.imgs.length > 0) {
            await Promise.all(post.imgs.map(img => destroyResource(img)));
        }
        await destroyResource(post.video, "video");
        
        await Post.findByIdAndDelete(postId);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error in deletePost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const commentOnPost = async (req, res) => {
	try {
		const { text, parentId } = req.body;
		const { id: postId } = req.params;
		const userId = req.user._id;

		if (!text) return res.status(400).json({ error: "Text field is required" });
		const moderation = moderateContent(text);
		if (moderation.blocked || moderation.flagged) {
			return res.status(400).json({
				error: \`Bình luận bị chặn do kiểm duyệt: \${formatModerationReasons(moderation.reasons).join(", ")}\`,
			});
		}

		const post = await Post.findById(postId);
		if (!post) return res.status(404).json({ error: "Post not found" });

        post.comments.push({ user: userId, text, parentId: parentId || null });
        await post.save();

        if (parentId) {
             // Handle reply notification
             const parentComment = post.comments.id(parentId);
             if (parentComment && parentComment.user.toString() !== userId.toString()) {
                  const notification = await Notification.create({
                      from: userId,
                      to: parentComment.user,
                      type: "reply",
                      postId: postId,
                  });
                  
                  const populatedNotif = await notification.populate("from", "fullName profileImg");
                  const receiverSocketId = getReceiverSocketId(parentComment.user);
                  if (receiverSocketId) io.to(receiverSocketId).emit("newNotification", populatedNotif);
             }
        }

        // Always notify post owner about a comment (if they didn't write it themselves)
        if (post.user.toString() !== userId.toString()) {
            const notification = await Notification.create({
                from: userId,
                to: post.user,
                type: "comment",
                postId: postId,
            });

            const populatedNotif = await notification.populate("from", "fullName profileImg");
            const receiverSocketId = getReceiverSocketId(post.user);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newNotification", populatedNotif);
            }
        }

        res.status(200).json(post);
    } catch (error) {
        console.error("Error in commentOnPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteComment = async (req, res) => {
	try {
		const { postId, commentId } = req.params;
		const userId = req.user._id;

		const post = await Post.findById(postId);
		if (!post) return res.status(404).json({ error: "Post not found" });

		const comment = post.comments.id(commentId);
		if (!comment) return res.status(404).json({ error: "Comment not found" });

		// Check if user is the author of the comment OR the author of the post
		if (comment.user.toString() !== userId.toString() && post.user.toString() !== userId.toString()) {
			return res.status(401).json({ error: "You are not authorized to delete this comment" });
		}

		post.comments.pull(commentId);
		await post.save();

		res.status(200).json({ message: "Comment deleted successfully", post });
	} catch (error) {
		console.error("Error in deleteComment controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const likeUnlikeComment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId, commentId } = req.params;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        const isLiked = comment.likes.includes(userId);

        if (isLiked) {
            // Unlike comment
            comment.likes.pull(userId);
            await post.save();
            res.status(200).json(comment.likes);
        } else {
            // Like comment
            comment.likes.push(userId);
            await post.save();
            
            // Notify comment author
            if (comment.user.toString() !== userId.toString()) {
                const notification = await Notification.create({
                    from: userId,
                    to: comment.user,
                    type: "like_comment",
                    postId: postId,
                });
                
                const populatedNotif = await notification.populate("from", "fullName profileImg");
                const receiverSocketId = getReceiverSocketId(comment.user);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", populatedNotif);
                }
            }

            res.status(200).json(comment.likes);
        }
    } catch (error) {
        console.error("Error in likeUnlikeComment controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id: postId } = req.params;
        const { type } = req.body; 

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const existingReactionIndex = post.reactions.findIndex((r) => r.user.toString() === userId.toString());

        if (existingReactionIndex !== -1) {
            const existingType = post.reactions[existingReactionIndex].type;
            
            if (existingType === type || !type) {
                post.reactions.splice(existingReactionIndex, 1);
                await post.save();
                await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
                res.status(200).json(post.reactions);
            } else {
                post.reactions[existingReactionIndex].type = type;
                await post.save();
                res.status(200).json(post.reactions);
            }
        } else {
            post.reactions.push({ user: userId, type: type || "like" });
            await post.save();
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });

            if (post.user.toString() !== userId.toString()) {
                const notification = await Notification.create({
                    from: userId,
                    to: post.user,
                    type: "like",
                    postId: postId,
                });

                const populatedNotif = await notification.populate("from", "fullName profileImg");
                const receiverSocketId = getReceiverSocketId(post.user);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", populatedNotif);
                }
            }
            res.status(200).json(post.reactions);
        }
    } catch (error) {
        console.error("Error in likeUnlikePost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getAllPosts = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const posts = await Post.find(PUBLIC_POST_FILTER)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.populate("user", "-password")
			.populate("comments.user", "-password")
			.populate({
				path: "repostOf",
				populate: {
					path: "user",
					select: "-password",
				},
			});

		res.status(200).json(filterVisiblePosts(posts.filter((post) => post.user !== null), req.user));
	} catch (error) {
		console.error("Error in getAllPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getPost = async (req, res) => {
	try {
		const { id } = req.params;
		const post = await Post.findById(id)
			.populate("user", "-password")
			.populate("comments.user", "-password")
			.populate({
				path: "repostOf",
				populate: {
					path: "user",
					select: "-password",
				},
			});

		if (!post) return res.status(404).json({ error: "Bài viết không tồn tại" });

		if (!isVisibleToViewer(post, req.user, { allowModeratedForOwner: true })) {
			return res.status(404).json({ error: "Bài viết không tồn tại" });
		}

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in getPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getLikedPosts = async (req, res) => {
	try {
		const { id: userId } = req.params;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const isMyProfile = req.user._id.toString() === userId.toString();
		const amIFollowing = user.followers.includes(req.user._id);

		if (user.isPrivate && !isMyProfile && !amIFollowing) {
			return res.status(200).json([]);
		}

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts }, ...PUBLIC_POST_FILTER })
			.skip(skip)
			.limit(limit)
			.populate("user", "-password")
			.populate("comments.user", "-password")
			.populate({
				path: "repostOf",
				populate: {
					path: "user",
					select: "-password",
				},
			});

		res.status(200).json(filterVisiblePosts(likedPosts.filter((post) => post.user !== null), req.user));
	} catch (error) {
		console.error("Error in getLikedPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getFollowingPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

        const following = user.following || [];

		const feedPosts = await Post.find({
            user: { $in: following },
            ...PUBLIC_POST_FILTER,
        })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.populate("user", "-password")
			.populate("comments.user", "-password")
			.populate({
				path: "repostOf",
				populate: {
					path: "user",
					select: "-password",
				},
			});

		res.status(200).json(filterVisiblePosts(feedPosts.filter((post) => post.user !== null), req.user));
	} catch (error) {
		console.error("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Lỗi máy chủ khi lấy bảng tin theo dõi" });
	}
};

export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const isMyProfile = req.user._id.toString() === user._id.toString();
		const amIFollowing = user.followers.includes(req.user._id);

		if (user.isPrivate && !isMyProfile && !amIFollowing) {
			return res.status(200).json([]);
		}

		const userPostFilter = isMyProfile || req.user.role === "admin" || req.user.email === "admin@gmail.com"
			? { user: user._id }
			: { user: user._id, ...PUBLIC_POST_FILTER };

		const posts = await Post.find(userPostFilter)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.populate("user", "-password")
			.populate("comments.user", "-password")
			.populate({
				path: "repostOf",
				populate: {
					path: "user",
					select: "-password",
				},
			});

		res.status(200).json(filterVisiblePosts(posts.filter((post) => post.user !== null), req.user, { allowModeratedForOwner: true }));
	} catch (error) {
		console.error("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const searchPosts = async (req, res) => {
	try {
		const { q } = req.query;
		if (!q) return res.status(400).json({ error: "Query is required" });

		const posts = await Post.find({
			text: { $regex: q, $options: "i" },
			...PUBLIC_POST_FILTER,
		})
			.sort({ createdAt: -1 })
			.populate("user", "-password")
			.populate("comments.user", "-password")
			.populate({
				path: "repostOf",
				populate: {
					path: "user",
					select: "-password",
				},
			})
			.limit(20);

		res.status(200).json(filterVisiblePosts(posts.filter((post) => post.user !== null), req.user));
	} catch (error) {
		console.error("Error in searchPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const editPost = async (req, res) => {
	try {
        const { text } = req.body;
        let { img } = req.body;
        const { id: postId } = req.params;
        const userId = req.user._id;

        let post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (post.user.toString() !== userId.toString()) {
            return res.status(401).json({ error: "You are not authorized to edit this post" });
        }

		if (typeof text === "string" && text.trim()) {
			const moderation = moderateContent([text, post.location].filter(Boolean).join(" "));
			if (moderation.blocked) {
				return res.status(400).json({
					error: \`Bài viết bị chặn do kiểm duyệt: \${formatModerationReasons(moderation.reasons).join(", ")}\`,
				});
			}

			post.moderation = buildModerationPayload(moderation);
		}

		if (img && img !== post.img) {
			if (post.img) {
				await cloudinary.uploader.destroy(post.img.split("/").pop().split(".")[0]);
			}
			const uploadedResponse = await cloudinary.uploader.upload(img);
			img = uploadedResponse.secure_url;
		}

		post.text = text || post.text;
		post.img = img || post.img;

		await post.save();

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in editPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const bookmarkPost = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id: postId } = req.params;

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const isBookmarked = user.bookmarks.includes(postId);

		if (isBookmarked) {
			await User.updateOne({ _id: userId }, { $pull: { bookmarks: postId } });
			res.status(200).json({ message: "Post unbookmarked successfully" });
		} else {
			user.bookmarks.push(postId);
			await user.save();
			res.status(200).json({ message: "Post bookmarked successfully" });
		}
	} catch (error) {
		console.error("Error in bookmarkPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getBookmarks = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).populate({
			path: "bookmarks",
			populate: [
				{ path: "user", select: "-password" },
				{ path: "repostOf", populate: { path: "user", select: "-password" } },
			],
		});

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(filterVisiblePosts(user.bookmarks.filter((post) => post.user !== null), req.user));
	} catch (error) {
		console.error("Error in getBookmarks controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const repostPost = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id: postId } = req.params;

		const post = await Post.findById(postId);
		if (!post) return res.status(404).json({ error: "Post not found" });

		if (!isApprovedPost(post) && post.user.toString() !== userId.toString() && req.user.role !== "admin" && req.user.email !== "admin@gmail.com") {
			return res.status(403).json({ error: "Bài viết này đang được kiểm duyệt" });
		}

		const alreadyReposted = post.reposts.includes(userId);

		if (alreadyReposted) {
			await Post.updateOne({ _id: postId }, { $pull: { reposts: userId } });
			await Post.findOneAndDelete({ user: userId, repostOf: postId });
			res.status(200).json({ message: "Post un-reposted successfully" });
		} else {
			post.reposts.push(userId);
			await post.save();

			const newRepost = new Post({ user: userId, repostOf: postId });
			await newRepost.save();

			if (post.user.toString() !== userId.toString()) {
				const notification = await Notification.create({
					from: userId,
					to: post.user,
					type: "like", 
				});

                const populatedNotif = await notification.populate("from", "fullName profileImg");
				const receiverSocketId = getReceiverSocketId(post.user);
				if (receiverSocketId) io.to(receiverSocketId).emit("newNotification", populatedNotif);
			}

			res.status(201).json(newRepost);
		}
	} catch (error) {
		console.error("Error in repostPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getTrendingHashtags = async (req, res) => {
	try {
		const trending = await Hashtag.find().sort({ count: -1 }).limit(5);
		res.status(200).json(trending || []);
	} catch (error) {
		console.error("Error in getTrendingHashtags controller: ", error);
		res.status(500).json({ error: "Lỗi máy chủ khi lấy danh sách hashtag thịnh hành" });
	}
};

export const getExplorePosts = async (req, res) => {
    try {
        const { category } = req.query;
		let matchQuery = {
			$and: [
				{
					$or: [
						{ img: { $exists: true, $ne: "" } },
						{ imgs: { $exists: true, $not: { $size: 0 } } },
						{ video: { $exists: true, $ne: "" } }
					]
				},
				PUBLIC_POST_FILTER,
			],
		};

        if (category && category !== "all") {
            matchQuery.$and.push({ hashtags: { $in: [category.toLowerCase()] } });
        }

		const posts = await Post.aggregate([
			{ $match: matchQuery },
            {
                $addFields: {
                    reactionCount: { $size: { $ifNull: ["$reactions", []] } },
                    commentCount: { $size: { $ifNull: ["$comments", []] } }
                }
            },
            { $sort: { reactionCount: -1, createdAt: -1 } },
            { $limit: 24 },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $project: {
                    "user.password": 0,
                    "user.email": 0,
                    "user.following": 0,
                    "user.followers": 0,
                }
            }
        ]);

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error in getExplorePosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
`;

fs.writeFileSync(file, content);
console.log("Successfully repaired post.controller.js");
