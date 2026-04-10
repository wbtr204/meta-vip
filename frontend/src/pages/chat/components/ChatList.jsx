import { useState } from "react";
import { Search, UserCheck, ChevronLeft, SquarePen, Users } from "lucide-react";
import { motion } from "framer-motion";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const ChatList = ({ 
    conversations, 
    allConversations,
    isLoading, 
    onSelect, 
    selectedId, 
    onlineUsers, 
    authUser,
    view,
    setView,
    requestsCount,
    friends = []
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSelectingFriend, setIsSelectingFriend] = useState(false);

    // Search xuyên suốt toàn bộ hội thoại để không bị sót
    const filteredConversations = (searchTerm ? allConversations : conversations)?.filter(conv => 
        conv.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 w-full md:w-[350px] shrink-0">
            {/* Header */}
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {view === "requests" || isSelectingFriend ? (
                        <button 
                            onClick={() => {
                                if (isSelectingFriend) setIsSelectingFriend(false);
                                else setView("main");
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                             <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {authUser?.username}
                            </h2>
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
                        </div>
                    )}
                    {(view === "requests" && !isSelectingFriend) && (
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Tin nhắn chờ
                        </h2>
                    )}
                    {isSelectingFriend && (
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Tin nhắn mới
                        </h2>
                    )}
                </div>
                {!isSelectingFriend && view === "main" && (
                    <button 
                         onClick={() => setIsSelectingFriend(true)}
                         className="p-2 text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                         title="Tin nhắn mới"
                    >
                        <SquarePen size={20} />
                    </button>
                )}
                {view === "main" && !isSelectingFriend && requestsCount > 0 && (
                    <button 
                        onClick={() => setView("requests")}
                        className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold rounded-lg transition-all"
                    >
                        {requestsCount} yêu cầu
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="px-4 mb-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm bạn bè..." 
                        className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-indigo-500/50 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
                {isSelectingFriend ? (
                    <div className="flex flex-col gap-1 py-2">
                        <div className="px-4 mb-3 mt-1">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bạn bè (Theo dõi chéo)</h3>
                        </div>
                        {friends.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                                    <Users size={32} />
                                </div>
                                <p className="text-sm text-slate-500 font-medium tracking-tight">Hãy theo dõi lẫn nhau để bắt đầu nhắn tin!</p>
                            </div>
                        ) : (
                            friends.map((friend) => (
                                <button
                                    key={friend._id}
                                    onClick={() => {
                                        onSelect({ 
                                            user: friend, 
                                            status: "accepted",
                                            lastMessage: null
                                        });
                                        setIsSelectingFriend(false);
                                    }}
                                    className="flex items-center gap-4 px-5 py-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 relative group rounded-2xl mx-2"
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                                            <img src={friend.profileImg || "/avatar-placeholder.png"} className="w-full h-full object-cover" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        <span className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                                            {friend.fullName}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                            @{friend.username}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col py-2">
                        {isLoading ? (
                            <div className="flex justify-center p-10"><LoadingSpinner size="md" /></div>
                        ) : (
                            <div className="flex flex-col">
                                {filteredConversations?.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                                            <UserCheck size={32} />
                                        </div>
                                        <p className="text-sm text-slate-400">Không tìm thấy hội thoại nào.</p>
                                    </div>
                                ) : (
                                    filteredConversations?.map((conv) => {
                                        const isOnline = onlineUsers?.includes(conv.user._id);
                                        const isUnread = conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.senderId !== authUser._id;
                                        
                                        return (
                                            <button
                                                key={conv._id || conv.user._id}
                                                onClick={() => onSelect(conv)}
                                                className={`flex items-center gap-4 px-5 py-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 relative group ${
                                                    selectedId === conv.user._id ? "bg-slate-50 dark:bg-slate-900" : ""
                                                } ${isUnread ? "bg-indigo-50/30 dark:bg-indigo-500/5" : ""}`}
                                            >
                                                {selectedId === conv.user._id && (
                                                    <motion.div 
                                                        layoutId="activeChat"
                                                        className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full"
                                                     />
                                                )}
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                                                        <img src={conv.user.profileImg || "/avatar-placeholder.png"} className="w-full h-full object-cover" />
                                                    </div>
                                                    {isOnline && (
                                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full shadow-sm"></div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col items-start flex-1 min-w-0">
                                                    <div className="flex items-center justify-between w-full mb-0.5">
                                                        <span className={`text-[14px] truncate ${isUnread ? "text-slate-900 dark:text-white font-black" : "text-slate-700 dark:text-slate-300 font-bold"}`}>
                                                            {conv.user.fullName}
                                                        </span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isUnread ? "text-indigo-500" : "text-slate-400"}`}>
                                                            {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full">
                                                        <p className={`text-xs truncate flex-1 text-left ${isUnread ? "font-bold text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                                                            {conv.lastMessage ? (
                                                                conv.lastMessage.senderId === authUser._id 
                                                                ? <span className="opacity-60 font-medium">Bạn: </span>
                                                                : ""
                                                            ) : ""}
                                                            {conv.lastMessage ? conv.lastMessage.message : "Bắt đầu cuộc trò chuyện..."}
                                                        </p>
                                                        {isUnread && (
                                                            <div className="flex items-center justify-center min-w-[10px] h-2.5 w-2.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-pulse">
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatList;
