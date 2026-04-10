import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);
export const PORT = process.env.PORT || 5000;
const io = new Server(server, {
	cors: {
		origin: true,
		methods: ["GET", "POST"],
	},
});

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};

export const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);

	const userId = socket.handshake.query.userId;
	if (userId != "undefined") userSocketMap[userId] = socket.id;

	// io.emit() is used to send events to all the connected clients
	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	// socket.on() is used to listen to the events. can be used both on client and server side
	socket.on("disconnect", () => {
		console.log("user disconnected", socket.id);
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});

    // Typing activity
    socket.on("typing", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", { senderId: userId });
        }
    });

    socket.on("stop-typing", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stop-typing", { senderId: userId });
        }
    });
});

export { app, io, server };
