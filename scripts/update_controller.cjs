const fs = require('fs');

let file = 'backend/controllers/post.controller.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace commentOnPost
const startCommentStr = `export const commentOnPost = async (req, res) => {`;
const endCommentStr = `    } catch (error) {
        console.error("Error in commentOnPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};`;

const newCommentCode = `export const commentOnPost = async (req, res) => {
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
                  const receiverSocketId = getReceiverSocketId(parentComment.user);
                  if (receiverSocketId) io.to(receiverSocketId).emit("newNotification", notification);
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

            const receiverSocketId = getReceiverSocketId(post.user);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newNotification", notification);
            }
        }

        res.status(200).json(post);
    } catch (error) {
        console.error("Error in commentOnPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};`;

let startIndex = content.indexOf(startCommentStr);
let endIndex = content.indexOf(endCommentStr, startIndex) + endCommentStr.length;
content = content.substring(0, startIndex) + newCommentCode + content.substring(endIndex);

// 2. Add likeUnlikeComment right after deleteComment
const deleteCommentEndStr = `		res.status(500).json({ error: "Internal server error" });
	}
};`;

const newLikeCommentCode = `

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
                
                const receiverSocketId = getReceiverSocketId(comment.user);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", notification);
                }
            }

            res.status(200).json(comment.likes);
        }
    } catch (error) {
        console.error("Error in likeUnlikeComment controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};`;

startIndex = content.indexOf(deleteCommentEndStr);
if (startIndex !== -1) {
    if(!content.includes('export const likeUnlikeComment')) {
        content = content.substring(0, startIndex + deleteCommentEndStr.length) + newLikeCommentCode + content.substring(startIndex + deleteCommentEndStr.length);
    }
}

fs.writeFileSync(file, content);
console.log("Updated post.controller.js");

// 3. Add to route
let routeFile = 'backend/routes/post.route.js';
let routeContent = fs.readFileSync(routeFile, 'utf8');
if (!routeContent.includes('likeUnlikeComment')) {
    routeContent = routeContent.replace('likeUnlikePost,', 'likeUnlikePost,\\n\\tlikeUnlikeComment,');
    routeContent = routeContent.replace('	likeUnlikePost,', '	likeUnlikePost,\n\tlikeUnlikeComment,');
    routeContent = routeContent.replace('router.post("/comment/:id", protectRoute, commentOnPost);', 'router.post("/comment/:id", protectRoute, commentOnPost);\nrouter.post("/comment/:postId/:commentId/like", protectRoute, likeUnlikeComment);');
    fs.writeFileSync(routeFile, routeContent);
    console.log("Updated post.route.js");
}
