const fs = require('fs');
const file = 'backend/controllers/post.controller.js';
let content = fs.readFileSync(file, 'utf8');

// Find export const likeUnlikePost and rewrite it until the next export
const regex = /export const likeUnlikePost = async \(req, res\) => {[\s\S]*?};/;
const newFunc = `export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id: postId } = req.params;
        const { type } = req.body; // like, love, haha, wow, sad, angry

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const existingReactionIndex = post.reactions.findIndex((r) => r.user.toString() === userId.toString());

        if (existingReactionIndex !== -1) {
            const existingType = post.reactions[existingReactionIndex].type;
            
            if (existingType === type || !type) {
                // Remove reaction if same type or no type provided (legacy like button)
                post.reactions.splice(existingReactionIndex, 1);
                await post.save();
                await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
                res.status(200).json(post.reactions);
            } else {
                // Update reaction type
                post.reactions[existingReactionIndex].type = type;
                await post.save();
                res.status(200).json(post.reactions);
            }
        } else {
            // Add new reaction
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
};`;

if (content.match(regex)) {
    content = content.replace(regex, newFunc);
    fs.writeFileSync(file, content);
    console.log("Repaired likeUnlikePost in post.controller.js");
} else {
    console.log("Could not find likeUnlikePost with regex");
}
