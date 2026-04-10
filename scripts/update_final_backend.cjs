const fs = require('fs');
const content = fs.readFileSync('backend/controllers/post.controller.js', 'utf8');

// Use regex to find the end of deleteComment
const deleteCommentEndRegex = /res\.status\(200\)\.json\({ message: "Comment deleted successfully", post }\);\n\t} catch \(error\) {\n\t\tconsole\.error\("Error in deleteComment controller: ", error\);\n\t\tres\.status\(500\)\.json\({ error: "Internal server error" }\);\n\t}\n};/;

const newFunction = `
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
};`;

// Check if it exists first
if (!content.includes('export const likeUnlikeComment')) {
    // Find the end of export const deleteComment
    const index = content.indexOf('export const deleteComment');
    if (index !== -1) {
        const nextFuncIndex = content.indexOf('export const', index + 30);
        const finalContent = content.substring(0, nextFuncIndex) + newFunction + '\n\n' + content.substring(nextFuncIndex);
        fs.writeFileSync('backend/controllers/post.controller.js', finalContent);
        console.log("Added likeUnlikeComment");
    }
}

// Update likeUnlikePost to use population
let updatedContent = fs.readFileSync('backend/controllers/post.controller.js', 'utf8');
if (updatedContent.includes('io.to(receiverSocketId).emit("newNotification", {')) {
    const oldPart = `await Notification.create({
                    from: userId,
                    to: post.user,
                    type: "like",
                    postId: postId,
                });

                const receiverSocketId = getReceiverSocketId(post.user);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", {
                        from: userId,
                        type: "like",
                        postId: postId
                    });
                }`;
    
    // Note: The above string has hardcoded spaces. I'll use a more flexible search.
    // Actually, I'll just use a simple string replace for the core lines.
    
    const target = 'io.to(receiverSocketId).emit("newNotification", {';
    if (updatedContent.includes(target)) {
        // This is tricky with scripts. Let's just do a simpler script for this part.
    }
}
