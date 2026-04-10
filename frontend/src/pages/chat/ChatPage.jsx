import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSocketContext } from "../../context/SocketContext";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";

const ChatPage = () => {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [view, setView] = useState("main"); // "main" or "requests"
	const { socket, onlineUsers } = useSocketContext();
	const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const targetUsername = searchParams.get("user");

    const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const { data: conversations, isLoading: isLoadingConversations } = useQuery({
		queryKey: ["conversations"],
		queryFn: async () => {
			const res = await fetch("/api/messages/conversations");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
	});

    // Fetch friends for "New Message" feature
    const { data: friends } = useQuery({
        queryKey: ["friends", authUser?._id],
        queryFn: async () => {
            if (!authUser?._id) return [];
            const res = await fetch(`/api/users/friends/${authUser._id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        enabled: !!authUser?._id
    });

    // Categorize conversations with string comparison for IDs
    const mainConversations = conversations?.filter(conv => 
        (conv.status === "accepted" || !conv.status) || 
        (conv.status === "pending" && (!conv.initiatorId || conv.initiatorId?.toString() === authUser?._id?.toString()))
    ) || [];

    const requestConversations = conversations?.filter(conv => 
        conv.status === "pending" && conv.initiatorId && conv.initiatorId?.toString() !== authUser?._id?.toString()
    ) || [];

    const currentConversations = view === "main" ? mainConversations : requestConversations;

	const { data: messages, isLoading: isLoadingMessages } = useQuery({
		queryKey: ["messages", selectedConversation?.user?._id],
		queryFn: async () => {
			if (!selectedConversation) return [];
			const res = await fetch(`/api/messages/${selectedConversation.user._id}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		enabled: !!selectedConversation,
	});

	const { mutate: sendMessage } = useMutation({
		mutationFn: async ({ message, image }) => {
			const res = await fetch(`/api/messages/send/${selectedConversation.user._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message, image }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		onSuccess: (newMessage) => {
			queryClient.setQueryData(["messages", selectedConversation.user._id], (old) => [...(old || []), newMessage]);
            setSelectedConversation((current) =>
                current
                    ? {
                            ...current,
                            status: newMessage.conversationStatus || current.status,
                            initiatorId:
                                newMessage.conversationStatus === "pending"
                                    ? current.initiatorId || authUser?._id
                                    : current.initiatorId,
                      }
                    : current
            );
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
		},
		onError: (error) => toast.error(error.message),
	});

    const { mutate: markAsRead } = useMutation({
        mutationFn: async (otherUserId) => {
            const res = await fetch(`/api/messages/read/${otherUserId}`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
    });

    // Handle URL ?user=username param
    useEffect(() => {
        if (targetUsername && conversations && authUser) {
            const existingConv = conversations.find(c => c.user.username === targetUsername);
            if (existingConv) {
                setSelectedConversation(existingConv);
                // Clear param after selecting
                setSearchParams({}, { replace: true });
            } else {
                // Fetch user info to start new chat
                const fetchUserInfo = async () => {
                    try {
                        const res = await fetch(`/api/users/profile/${targetUsername}`);
                        const data = await res.json();
                        if (res.ok) {
                            setSelectedConversation({
                                user: data,
                                status: "accepted", // Initial state for friends if found through profile
                                messages: []
                            });
                        }
                        setSearchParams({}, { replace: true });
                    } catch (error) {
                        console.error("Error fetching target user:", error);
                    }
                };
                fetchUserInfo();
            }
        }
    }, [targetUsername, conversations, authUser, setSearchParams]);

	useEffect(() => {
		if (!socket) return;

		socket.on("newMessage", (newMessage) => {
            // Update messages if the active chat matches the sender
			if (selectedConversation?.user?._id === newMessage.senderId) {
				queryClient.setQueryData(["messages", selectedConversation.user._id], (old) => [...(old || []), newMessage]);
                markAsRead(newMessage.senderId);
			}

            // Always update conversation list for last message preview
             queryClient.invalidateQueries({ queryKey: ["conversations"] });
		});

        socket.on("requestAccepted", () => {
            toast.success("Yêu cầu nhắn tin đã được chấp nhận!");
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        });

        socket.on("typing", ({ senderId }) => {
            if (selectedConversation?.user?._id === senderId) {
                setIsOtherTyping(true);
            }
        });

        socket.on("stop-typing", ({ senderId }) => {
            if (selectedConversation?.user?._id === senderId) {
                setIsOtherTyping(false);
            }
        });

		return () => {
            socket.off("newMessage");
            socket.off("requestAccepted");
            socket.off("typing");
            socket.off("stop-typing");
        };
	}, [socket, selectedConversation, queryClient, markAsRead]);

    // Handle initial read marker
    useEffect(() => {
        if (selectedConversation?.user?._id && selectedConversation.status === "accepted") {
            markAsRead(selectedConversation.user._id);
        }
    }, [selectedConversation, markAsRead]);

    const handleSend = (msgData) => {
        sendMessage(msgData);
    };

    const handleTyping = (isTyping) => {
        if (!socket || !selectedConversation) return;
        if (isTyping) {
            socket.emit("typing", { receiverId: selectedConversation.user._id });
        } else {
            socket.emit("stop-typing", { receiverId: selectedConversation.user._id });
        }
    };

	return (
		<div className="flex flex-1 w-full h-full min-h-0 overflow-hidden">
			<div className="grid w-full h-full min-h-0 overflow-hidden sm:rounded-[32px] rounded-none border border-slate-200/50 bg-white shadow-sm dark:border-slate-800/50 dark:bg-slate-950 md:grid-cols-[340px_minmax(0,1fr)]">
				<div className={`${selectedConversation ? "hidden md:block" : "block"} h-full min-h-0`}>
					<ChatList
						conversations={currentConversations}
						isLoading={isLoadingConversations}
						onSelect={setSelectedConversation}
						selectedId={selectedConversation?.user?._id}
						onlineUsers={onlineUsers}
						authUser={authUser}
						view={view}
						setView={setView}
						requestsCount={requestConversations.length}
						allConversations={conversations}
						friends={friends}
					/>
				</div>

				<div className={`${!selectedConversation ? "hidden md:flex" : "flex"} flex-col h-full min-h-0 min-w-0`}>
					<ChatWindow
						selectedConversation={selectedConversation}
						messages={messages}
						isLoading={isLoadingMessages}
						onSend={handleSend}
						onBack={() => setSelectedConversation(null)}
						onConversationUpdate={setSelectedConversation}
						authUser={authUser}
						isTyping={isOtherTyping}
						onTyping={handleTyping}
					/>
				</div>
			</div>
		</div>
	);
};

export default ChatPage;
