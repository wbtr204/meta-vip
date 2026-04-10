const fs = require('fs');
const file = 'backend/controllers/post.controller.js';
let content = fs.readFileSync(file, 'utf8');

const anchor = `        } else {
        res.status(500).json({ error: "Internal server error" });
    }
};`;

const fix = `        } else {
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

if (content.includes(anchor)) {
    content = content.replace(anchor, fix);
    fs.writeFileSync(file, content);
    console.log("Repaired post.controller.js");
} else {
    console.log("Could not find anchor in post.controller.js");
}
