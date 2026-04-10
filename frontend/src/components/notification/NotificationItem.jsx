import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { 
    Heart, 
    MessageSquare, 
    UserPlus, 
    AtSign, 
    ShieldAlert, 
    X,
    ExternalLink,
    Clock,
    Check
} from "lucide-react";
import { motion } from "framer-motion";

const NotificationItem = React.forwardRef(({ notification, onDelete, onAccept, onReject, onMarkRead }, ref) => {
    const navigate = useNavigate();
    const isUnread = !notification.read;

    const getIcon = () => {
        switch (notification.type) {
            case "like":
                return { 
                    icon: <Heart size={14} fill="currentColor" />, 
                    color: "bg-rose-500", 
                    text: "đã yêu thích bài viết của bạn" 
                };
            case "comment":
                return { 
                    icon: <MessageSquare size={14} fill="currentColor" />, 
                    color: "bg-indigo-500", 
                    text: "đã bình luận về bài viết của bạn" 
                };
            case "follow_request":
                return { 
                    icon: <UserPlus size={14} />, 
                    color: "bg-amber-500", 
                    text: "muốn theo dõi bạn" 
                };
            case "follow":
                return { 
                    icon: <UserPlus size={14} />, 
                    color: "bg-blue-500", 
                    text: "đã bắt đầu theo dõi bạn" 
                };
            case "follow_accept":
                return { 
                    icon: <Check size={14} />, 
                    color: "bg-indigo-500", 
                    text: "đã chấp nhận yêu cầu theo dõi của bạn" 
                };
            case "mention":
                return { 
                    icon: <AtSign size={14} />, 
                    color: "bg-purple-500", 
                    text: "đã nhắc đến bạn trong một bài viết" 
                };
            default:
                return { 
                    icon: <ShieldAlert size={14} />, 
                    color: "bg-slate-500", 
                    text: "hệ thống gửi cho bạn một thông báo" 
                };
        }
    };

    const { icon, color, text } = getIcon();

    const handleItemClick = () => {
        // Mark as read if unread
        if (isUnread && onMarkRead) {
            onMarkRead(notification._id);
        }

        // Navigate based on type
        if (notification.postId) {
            navigate(`/post/${notification.postId}`);
        } else if (notification.from?.username) {
            navigate(`/profile/${notification.from.username}`);
        }
    };

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={handleItemClick}
            className={`group relative flex items-start gap-5 p-6 rounded-[2rem] transition-all duration-300 border cursor-pointer ${
                isUnread 
                ? "bg-indigo-50/40 dark:bg-indigo-500/5 border-indigo-100/50 dark:border-indigo-500/20 shadow-sm" 
                : "bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60"
            }`}
        >
            {/* Unread Indicator Pulse */}
            {isUnread && (
                <div className="absolute top-8 right-8">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                    </span>
                </div>
            )}

            {/* Avatar with Floating Icon */}
            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <Link to={`/profile/${notification.from?.username}`}>
                    <div className="h-14 w-14 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-lg group-hover:scale-105 transition-transform">
                        <img 
                            src={notification.from?.profileImg || "/avatar-placeholder.png"} 
                            className="h-full w-full object-cover" 
                            alt={notification.from?.fullName ?? "Người dùng"}
                        />
                    </div>
                </Link>
                <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-xl ${color} text-white shadow-xl border-4 border-white dark:border-slate-900`}>
                    {icon}
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 min-w-0 pr-10">
                <div className="mb-2">
                    <div className="flex flex-wrap items-baseline gap-1.5 leading-tight">
                        <span className={`text-sm ${isUnread ? "text-slate-900 dark:text-white font-black" : "text-slate-600 dark:text-slate-300 font-bold"}`}>
                            {notification.from?.fullName ?? "Người dùng"}
                        </span>
                        <span className={`text-sm ${isUnread ? "text-slate-700 dark:text-slate-300 font-bold" : "text-slate-500 dark:text-slate-400 font-medium"}`}>
                            {text}
                        </span>
                    </div>
                </div>
                
                {/* Follow Request Actions */}
                {notification.type === "follow_request" && (
                    <div className="flex items-center gap-3 mt-4 mb-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={() => onAccept(notification.from?._id)}
                            className="px-6 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5"
                        >
                            Chấp nhận
                        </button>
                        <button 
                            onClick={() => onReject(notification.from?._id)}
                            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
                        >
                            Từ chối
                        </button>
                    </div>
                )}
                
                <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Clock size={12} />
                        <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}</span>
                    </div>
                    
                    {(notification.type === "like" || notification.type === "comment") && notification.postId && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                            <span>Xem bài viết</span>
                            <ExternalLink size={10} />
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions (Delete) */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification._id);
                    }}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shadow-xl ring-1 ring-slate-100 dark:ring-slate-700"
                    title="Xóa vĩnh viễn"
                >
                    <X size={18} />
                </button>
            </div>
        </motion.div>
    );
});

NotificationItem.displayName = "NotificationItem";

export default NotificationItem;
