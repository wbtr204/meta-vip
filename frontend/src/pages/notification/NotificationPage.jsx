import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { 
    Bell, 
    Trash2, 
    ShieldAlert,
    Inbox,
    EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import LoadingSpinner from "../../components/common/LoadingSpinner";
import NotificationItem from "../../components/notification/NotificationItem";

const TABS = [
    { id: "all", label: "Tất cả", icon: <Inbox size={16} /> },
    { id: "unread", label: "Chưa đọc", icon: <Bell size={16} /> },
    { id: "system", label: "Hệ thống", icon: <ShieldAlert size={16} /> },
];

const NotificationPage = () => {
    const [activeTab, setActiveTab] = useState("all");
	const queryClient = useQueryClient();

	const { data: notifications, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			const res = await fetch("/api/notifications");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Không thể tải thông báo");
			return data;
		},
	});

	const { mutate: markAsRead } = useMutation({
		mutationFn: async (id = null) => {
			const res = await fetch("/api/notifications/read", {
				method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Thao tác thất bại");
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] });
		},
	});

    // Mark all as read on mount
    useEffect(() => {
        markAsRead();
    }, [markAsRead]);

	const { mutate: deleteReadNotifications } = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/notifications/read", {
				method: "DELETE",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Thao tác thất bại");
			return data;
		},
		onSuccess: () => {
			toast.success("Đã dọn dẹp các thông báo đã xem");
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});

    const { mutate: deleteSingleNotification } = useMutation({
        mutationFn: async (id) => {
            const res = await fetch(`/api/notifications/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Thao tác thất bại");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
        onError: (error) => toast.error(error.message),
    });

	const { mutate: acceptRequest } = useMutation({
		mutationFn: async (id) => {
			const res = await fetch(`/api/users/accept-request/${id}`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Thao tác thất bại");
			return data;
		},
		onSuccess: () => {
			toast.success("Đã chấp nhận yêu cầu theo dõi");
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: (error) => toast.error(error.message),
	});

	const { mutate: rejectRequest } = useMutation({
		mutationFn: async (id) => {
			const res = await fetch(`/api/users/reject-request/${id}`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Thao tác thất bại");
			return data;
		},
		onSuccess: () => {
			toast.success("Đã xóa yêu cầu theo dõi");
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: (error) => toast.error(error.message),
	});

    const filteredNotifications = notifications?.filter(n => {
        if (activeTab === "unread") return !n.read;
        if (activeTab === "system") return n.type === "system";
        return true;
    });

    const unreadCount = notifications?.filter(n => !n.read).length || 0;
    const readCount = notifications?.filter(n => n.read).length || 0;

	return (
		<div className="flex-1 min-h-screen bg-white dark:bg-slate-950 pb-20">
            {/* Header Area */}
            <div className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-3xl mx-auto px-4 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="p-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-xl">
                                    <Bell size={24} />
                                </div>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-6 w-6 bg-indigo-500 text-[10px] items-center justify-center text-white font-black">
                                            {unreadCount}
                                        </span>
                                    </span>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Trung tâm thông báo
                                </h1>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    QUẢN LÝ TƯƠNG TÁC VÀ HỆ THỐNG
                                </p>
                            </div>
                        </div>

                        {/* Action Bar - Simplified to only Clear Read notifications */}
                        <div className="flex flex-wrap items-center gap-2">
                            {readCount > 0 && (
                                <button 
                                    onClick={() => deleteReadNotifications()}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                                >
                                    <Trash2 size={16} />
                                    <span>Dọn dẹp thông báo đã xem</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex items-center gap-2 mt-10 p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 self-start inline-flex">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                    activeTab === tab.id
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Area */}
            <div className="max-w-3xl mx-auto px-4 py-12">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <LoadingSpinner size="lg" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
                            Đang đồng bộ dữ liệu...
                        </p>
                    </div>
                )}

                {!isLoading && filteredNotifications?.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-24 text-center bg-slate-50/50 dark:bg-slate-900/10 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
                    >
                        <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-200 dark:text-slate-700 mb-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <EyeOff size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
                             Hộp thư trống
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 text-sm max-w-[280px] font-bold uppercase leading-relaxed tracking-wider">
                            {activeTab === "unread" 
                                ? "TUYỆT VỜI! BẠN ĐÃ XỬ LÝ HẾT THÔNG BÁO MỚI." 
                                : "HIỆN KHÔNG CÓ THÔNG BÁO NÀO TRONG MỤC NÀY."}
                        </p>
                    </motion.div>
                )}

                <div className="flex flex-col gap-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {filteredNotifications?.map((notification) => (
                            <NotificationItem 
                                key={notification._id} 
                                notification={notification} 
                                onDelete={deleteSingleNotification}
                                onAccept={acceptRequest}
                                onReject={rejectRequest}
                                onMarkRead={markAsRead}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
		</div>
	);
};

export default NotificationPage;
