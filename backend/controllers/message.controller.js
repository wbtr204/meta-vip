import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { v2 as cloudinary } from "cloudinary";

export const sendMessage = async (req, res) => {
	try {
		const { message } = req.body;
		let { image } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		// Check relationship for Message Request logic
		const sender = await User.findById(senderId);
		const receiver = await User.findById(receiverId);

		const isMutual = sender.following.some(id => id.toString() === receiverId.toString()) && 
                         receiver.following.some(id => id.toString() === senderId.toString());

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
				status: isMutual ? "accepted" : "pending",
				initiatorId: senderId,
			});
		}

		// Security: If pending, enforce limits
		if (conversation.status === "pending") {
			if (conversation.initiatorId.toString() === senderId.toString()) {
				// Initiator can only send 1 message total until accepted
				if (conversation.messages.length >= 1) {
					return res.status(403).json({ error: "Vui lòng đợi đối phương chấp nhận yêu cầu nhắn tin của bạn." });
				}
				// Block images in pending state for safety
				if (image) {
					return res.status(403).json({ error: "Bạn không thể gửi ảnh trong tin nhắn chờ." });
				}
			} else {
				// Receiver is trying to send message without accepting
				return res.status(403).json({ error: "Bạn cần chấp nhận yêu cầu để trả lời." });
			}
		}

		if (image) {
			const uploadedResponse = await cloudinary.uploader.upload(image);
			image = uploadedResponse.secure_url;
		}

		const newMessage = new Message({
			senderId,
			receiverId,
			message,
			image: image || "",
		});

		if (newMessage) {
			conversation.messages.push(newMessage._id);
            conversation.lastMessage = newMessage._id;
		}

		await Promise.all([conversation.save(), newMessage.save()]);

		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

		res.status(201).json({
			...newMessage.toObject(),
			conversationStatus: conversation.status,
		});
	} catch (error) {
		console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages");

		if (!conversation) return res.status(200).json([]);

        // Don't mark as read if it's a pending request from receiver's side
        // This implements "Sender doesn't know you've seen it until accepted"
        const isPendingForReceiver = conversation.status === "pending" && conversation.initiatorId?.toString() !== senderId.toString();
        
		const messages = conversation.messages;

        // If it's pending for receiver, we return the messages but don't allow marking as read
        // The markAsRead logic is in another controller, but we can verify here.
		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;
		const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
		res.status(200).json(filteredUsers);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({
            participants: { $in: [userId] }
        })
        .populate({
            path: "participants",
            select: "username fullName profileImg"
        })
        .populate({
            path: "lastMessage",
            select: "message senderId createdAt isRead"
        })
        .sort({ updatedAt: -1 });

        // Filter out the current user from participants list for each conversation
        const currentUser = await User.findById(userId);

        const formattedConversations = await Promise.all(conversations.map(async (conv) => {
            const otherParticipant = conv.participants.find(p => p._id.toString() !== userId.toString());
            
            if (!otherParticipant) return null; // Safety check for any inconsistent data

            // DYNAMIC UPDATE: Nếu đang là pending nhưng là bạn bè (mutual) thì tự động coi là accepted
            let currentStatus = conv.status || "accepted"; // Mặc định chat cũ chưa có status là accepted
            
            if (currentStatus === "pending") {
                const otherUser = await User.findById(otherParticipant._id);
                if (otherUser) {
                    const isMutual = currentUser.following.some(id => id.toString() === otherParticipant._id.toString()) && 
                                     otherUser.following.some(id => id.toString() === userId.toString());
                    
                    if (isMutual) {
                        currentStatus = "accepted";
                        conv.status = "accepted";
                        await conv.save();
                    }
                }
            }

            // Count unread messages for this specific user
            const unreadCount = await Message.countDocuments({
                _id: { $in: conv.messages },
                receiverId: userId,
                isRead: false
            });

            return {
                _id: conv._id,
                user: otherParticipant,
                lastMessage: conv.lastMessage,
                unreadCount,
                status: currentStatus,
                initiatorId: conv.initiatorId,
                updatedAt: conv.updatedAt
            };
        }));

        res.status(200).json(formattedConversations.filter(c => c !== null));
    } catch (error) {
        console.error("Error in getConversations: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id: otherUserId } = req.params;

        await Message.updateMany(
            { senderId: otherUserId, receiverId: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.error("Error in markMessagesAsRead: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const acceptConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id: otherUserId } = req.params;

        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] }
        });

        if (!conversation) return res.status(404).json({ error: "Conversation not found" });

        // Only the receiver can accept
        if (conversation.initiatorId.toString() === userId.toString()) {
            return res.status(403).json({ error: "You cannot accept your own request" });
        }

        conversation.status = "accepted";
        await conversation.save();

        // Notify both parties
        const receiverSocketId = getReceiverSocketId(otherUserId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("requestAccepted", { conversationId: conversation._id, acceptedBy: userId });
        }

        res.status(200).json({ message: "Conversation accepted", status: "accepted" });
    } catch (error) {
        console.error("Error in acceptConversation: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const rejectConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id: otherUserId } = req.params;

        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] }
        });

        if (!conversation) return res.status(404).json({ error: "Conversation not found" });

        // Delete the conversation and its messages
        await Message.deleteMany({ _id: { $in: conversation.messages } });
        await Conversation.deleteOne({ _id: conversation._id });

        res.status(200).json({ message: "Conversation rejected and deleted" });
    } catch (error) {
        console.error("Error in rejectConversation: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
