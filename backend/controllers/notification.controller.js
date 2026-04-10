import Notification from "../models/notification.model.js";

export const getUnreadCount = async (req, res) => {
	try {
		const userId = req.user?._id;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const count = await Notification.countDocuments({ 
            to: userId, 
            read: false,
            type: { $ne: "message" } // Loại trừ thông báo tin nhắn
        });
		res.status(200).json({ count });
	} catch (error) {
		console.error("Error in getUnreadCount function:", error);
		res.status(500).json({ error: error.message || "Internal Server Error" });
	}
};

export const getNotifications = async (req, res) => {
	try {
		const userId = req.user?._id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const notifications = await Notification.find({ 
            to: userId,
            type: { $ne: "message" } // Loại trừ thông báo tin nhắn
        })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate({
                path: "from",
                select: "username profileImg fullName",
            });

		res.status(200).json(notifications);
	} catch (error) {
		console.error("Error in getNotifications function:", error);
		res.status(500).json({ error: error.message || "Internal Server Error" });
	}
};

export const markNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.body; // Optional ID for individual mark read

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        if (id) {
            // Mark a specific notification as read
            await Notification.findOneAndUpdate({ _id: id, to: userId }, { read: true });
        } else {
            // Mark all notifications for this user as read
            await Notification.updateMany({ to: userId, read: false }, { read: true });
        }

        res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
        console.error("Error in markNotificationsAsRead function:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

export const deleteReadNotifications = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        await Notification.deleteMany({ to: userId, read: true });

        res.status(200).json({ message: "Read notifications cleared successfully" });
    } catch (error) {
        console.error("Error in deleteReadNotifications function:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const notification = await Notification.findById(id);

        if (!notification) return res.status(404).json({ error: "Notification not found" });
        if (notification.to.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await Notification.findByIdAndDelete(id);
        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Error in deleteNotification function:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

export const deleteNotifications = async (req, res) => {
	try {
		const userId = req.user?._id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

		await Notification.deleteMany({ to: userId });

		res.status(200).json({ message: "Notifications deleted successfully" });
	} catch (error) {
		console.error("Error in deleteNotifications function:", error);
		res.status(500).json({ error: error.message || "Internal Server Error" });
	}
};
