import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutDashboard, 
    Users, 
    ShieldAlert, 
    History, 
    Settings, 
    Activity, 
    AlertTriangle,
    CheckCircle2,
    Server,
    TrendingUp,
    Filter,
    ArrowUpRight,
    Clock,
    FileText
} from "lucide-react";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatsCard from "../../components/admin/StatsCard";
import UserTable from "../../components/admin/UserTable";
import AnalyticsChart from "../../components/admin/AnalyticsChart";

const MODERATION_REASON_LABELS = {
    toxic_language: "Ngôn từ xúc phạm",
    hate_speech: "Ngôn từ thù ghét",
    personal_attack: "Công kích cá nhân",
    scam_terms: "Dấu hiệu lừa đảo",
    spam_promo: "Spam quảng cáo",
    too_many_links: "Quá nhiều liên kết",
    excessive_hashtags: "Quá nhiều hashtag",
    excessive_mentions: "Quá nhiều đề cập",
    repeated_chars: "Ký tự lặp bất thường",
    excessive_caps: "Viết hoa bất thường",
    repeated_words: "Nội dung lặp lại",
};

const getModerationLabel = (reason) => MODERATION_REASON_LABELS[reason] || reason.replace(/_/g, " ");

const AdminPage = () => {
    const [activeSection, setActiveSection] = useState("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [localConfig, setLocalConfig] = useState({ maintenanceMode: false, allowRegistration: true, postThreshold: 100, userMaxCache: "512MB" });
    const queryClient = useQueryClient();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleInviteUser = () => {
        const inviteLink = `${window.location.origin}/signup?ref=admin_invite_vip`;
        navigator.clipboard.writeText(inviteLink);
        toast.success("Đã copy link mời đăng nhập vào Local Clipboard!");
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ["adminStats"] });
        queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
        queryClient.invalidateQueries({ queryKey: ["adminReports"] });
        queryClient.invalidateQueries({ queryKey: ["adminModerationPosts"] });
        queryClient.invalidateQueries({ queryKey: ["adminConfig"] });
        toast.success("Hệ thống đã được đồng bộ dữ liệu mới nhất!");
    };

    const handleExportData = async () => {
        try {
            const toastId = toast.loading("Đang xuất dữ liệu...");
            const res = await fetch("/api/admin/export");
            if (!res.ok) throw new Error("Lỗi khi xuất dữ liệu");
            const data = await res.json();
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `vibenet_export_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Báo cáo số liệu đã được tải xuống máy của bạn!", { id: toastId });
        } catch (error) {
            toast.error(error.message);
        }
    };

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["adminStats"],
        queryFn: async () => {
            const res = await fetch("/api/admin/stats");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch stats");
            return data;
        },
        refetchInterval: 30000, // Refresh stats every 30s
    });

    const { data: userData, isLoading: usersLoading, isFetching: usersFetching } = useQuery({
        queryKey: ["adminUsers", debouncedSearchTerm, page],
        queryFn: async () => {
            const res = await fetch(`/api/admin/users?search=${encodeURIComponent(debouncedSearchTerm)}&page=${page}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch users");
            return data;
        },
        enabled: activeSection === "users",
        placeholderData: (previousData) => previousData,
    });

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const { data: reports, isLoading: reportsLoading } = useQuery({
        queryKey: ["adminReports"],
        queryFn: async () => {
            const res = await fetch("/api/admin/reports");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch reports");
            return data;
        },
        enabled: activeSection === "moderation",
    });

    const { data: moderationPosts, isLoading: moderationPostsLoading } = useQuery({
        queryKey: ["adminModerationPosts"],
        queryFn: async () => {
            const res = await fetch("/api/admin/moderation/posts");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch moderation posts");
            return data;
        },
        enabled: activeSection === "moderation",
    });

    const { data: logs, isLoading: logsLoading } = useQuery({
        queryKey: ["adminLogs"],
        queryFn: async () => {
            const res = await fetch("/api/admin/logs");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch logs");
            return data;
        },
        enabled: activeSection === "logs",
    });

    const { data: config } = useQuery({
        queryKey: ["adminConfig"],
        queryFn: async () => {
            const res = await fetch("/api/admin/config");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch config");
            return data;
        },
        enabled: activeSection === "settings" || activeSection === "overview", // Overview also uses emergency status
    });

    useEffect(() => {
        if (config) {
            setLocalConfig({
                maintenanceMode: config.maintenanceMode || false,
                allowRegistration: config.allowRegistration ?? true,
                postThreshold: config.postThreshold || 100,
                userMaxCache: config.userMaxCache || "512MB",
            });
        }
    }, [config]);

    const handleQuickToggle = (key) => {
        const nextConfig = { ...localConfig, [key]: !localConfig[key] };
        setLocalConfig(nextConfig);
        updateConfig(nextConfig);
    };

    // Mutations
    const { mutate: resolveReport } = useMutation({
        mutationFn: async ({ reportId, status, actionTaken }) => {
            const res = await fetch(`/api/admin/resolve-report/${reportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, actionTaken }),
            });
            if (!res.ok) throw new Error("Failed to resolve report");
        },
        onSuccess: () => {
            toast.success("Đã xử lý báo cáo");
            queryClient.invalidateQueries({ queryKey: ["adminReports"] });
            queryClient.invalidateQueries({ queryKey: ["adminLogs"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
        },
    });

    const { mutate: reviewModerationPost } = useMutation({
        mutationFn: async ({ postId, action }) => {
            const res = await fetch(`/api/admin/moderation/posts/${postId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to review moderation post");
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Đã cập nhật kiểm duyệt");
            queryClient.invalidateQueries({ queryKey: ["adminModerationPosts"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
            queryClient.invalidateQueries({ queryKey: ["adminLogs"] });
        },
    });

    const { mutate: updateConfig, isPending: updatingConfig } = useMutation({
        mutationFn: async (newConfig) => {
            const res = await fetch("/api/admin/config", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newConfig),
            });
            if (!res.ok) throw new Error("Cập nhật cấu hình thất bại");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Đã lưu cấu hình hệ thống");
            queryClient.invalidateQueries({ queryKey: ["adminConfig"] });
            queryClient.invalidateQueries({ queryKey: ["adminLogs"] });
        },
        onError: (error) => toast.error(error.message),
    });

    const { mutate: toggleEmergency, isPending: togglingEmergency } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/admin/emergency", { method: "POST" });
            if (!res.ok) throw new Error("Lỗi khi chuyển đổi trạng thái khẩn cấp");
            return res.json();
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["adminConfig"] });
            queryClient.invalidateQueries({ queryKey: ["adminLogs"] });
            setShowEmergencyModal(false);
        },
        onError: (error) => toast.error(error.message),
    });

    if (statsLoading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-950">
            <LoadingSpinner size="lg" />
        </div>
    );

    const sidebarItems = [
        { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
        { id: "users", label: "Người dùng", icon: Users },
        { id: "moderation", label: "Kiểm duyệt", icon: ShieldAlert, badge: (statsData?.stats?.pendingReports || 0) + (statsData?.stats?.flaggedPosts || 0) },
        { id: "logs", label: "Nhật ký hệ thống", icon: History },
        { id: "settings", label: "Cấu hình Web", icon: Settings },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-8rem)] py-6 px-4 md:px-0 bg-slate-50 dark:bg-slate-950/20 rounded-[32px]">
            {/* Admin Sidebar Navigation */}
            <aside className="w-full lg:w-64 flex flex-col gap-2">
                <div className="px-5 mb-8">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-widest uppercase">Admin Panel</h1>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Trung tâm quản trị</p>
                </div>

                <nav className="flex flex-col gap-1.5 px-2">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const active = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
                                    active 
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-950/10 dark:shadow-white/5" 
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                                    <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                                </div>
                                {item.badge > 0 && !active && (
                                    <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-8 px-4 py-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Server size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Health</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                <span>CPU LOAD</span>
                                <span>{statsData?.serverHealth?.cpuLoad || 0}%</span>
                            </div>
                            <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${statsData?.serverHealth?.cpuLoad || 0}%` }} className="h-full bg-emerald-500" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                <span>RAM USAGE</span>
                                <span>{statsData?.serverHealth?.ramUsage || 0}%</span>
                            </div>
                            <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${statsData?.serverHealth?.ramUsage || 0}%` }} className="h-full bg-amber-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Admin Content Area */}
            <main className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                        className="space-y-8"
                    >
                        {/* Section Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">
                                    {sidebarItems.find(i => i.id === activeSection)?.label}
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">Bảng điều khiển hệ thống • Real-time Monitoring</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleRefresh}
                                    title="Làm mới dữ liệu"
                                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm active:scale-95 transition-all"
                                >
                                    <Activity size={18} />
                                </button>
                                <button 
                                    onClick={handleExportData}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-950/20 active:scale-95 transition-all"
                                >
                                    Export Data
                                </button>
                            </div>
                        </div>

                        {activeSection === "overview" && (
                            <div className="space-y-8">
                                {/* Dashboard Bento Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatsCard title="Users" value={statsData?.stats?.totalUsers} icon={Users} color="bg-indigo-500" trend={12} />
                                    <StatsCard title="Posts" value={statsData?.stats?.totalPosts} icon={FileText} color="bg-emerald-500" trend={5} />
                                    <StatsCard title="Online" value={statsData?.stats?.onlineUsers} icon={Activity} color="bg-amber-500" trend={24} />
                                    <StatsCard title="Health" value="99.9%" icon={CheckCircle2} color="bg-blue-500" />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Analytics Chart */}
                                    <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500"><TrendingUp size={20} /></div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Growth Analytics</h3>
                                            </div>
                                        </div>
                                        <div className="h-[300px]">
                                            <AnalyticsChart data={statsData?.analyticsData} />
                                        </div>
                                    </div>

                                    {/* Top Performers / Activity Sidebar */}
                                    <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm flex flex-col gap-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quick Actions</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            <button 
                                                onClick={handleInviteUser}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/50 active:scale-95 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Users size={16} className="text-indigo-500" />
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Invite User</span>
                                                </div>
                                                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                            </button>
                                            <button 
                                                onClick={() => setShowEmergencyModal(true)}
                                                className={`flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border transition-all group active:scale-95 ${config?.emergencyStop ? "border-amber-500/50 hover:border-amber-500" : "border-slate-200/60 dark:border-slate-800/60 hover:border-red-500/50"}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <AlertTriangle size={16} className={config?.emergencyStop ? "text-amber-500" : "text-red-500"} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                                        {config?.emergencyStop ? "Resume System" : "Emergency Stop"}
                                                    </span>
                                                </div>
                                                <ArrowUpRight size={14} className={`transition-colors ${config?.emergencyStop ? "text-amber-500" : "text-slate-400 group-hover:text-red-500"}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "users" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {usersLoading && !userData ? <LoadingSpinner /> : (
                                    <div className="relative">
                                        {usersFetching && (
                                            <div className="absolute top-0 right-0 m-4 z-10">
                                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                        <UserTable 
                                            users={userData?.users} 
                                            total={userData?.total} 
                                            searchTerm={searchTerm}
                                            setSearchTerm={setSearchTerm}
                                            page={page}
                                            setPage={setPage}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection === "moderation" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><ShieldAlert size={16} /></div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Bài bị gắn cờ tự động</h3>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{moderationPosts?.length || 0} bài</span>
                                    </div>

                                    {moderationPostsLoading ? <LoadingSpinner /> : moderationPosts?.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 opacity-60">
                                            <CheckCircle2 size={40} className="text-slate-300 mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Không có bài nào đang chờ</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {moderationPosts?.map((post) => (
                                                <div key={post._id} className="p-6 bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-500/20 rounded-[32px] flex flex-col gap-5 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><AlertTriangle size={16} /></div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Auto flagged</span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: #{post._id.slice(-6)}</span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={post.user?.profileImg || "/avatar-placeholder.png"}
                                                            alt="author"
                                                            className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800"
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-slate-900 dark:text-white">@{post.user?.username}</div>
                                                            <div className="text-[11px] text-slate-500">{new Date(post.createdAt).toLocaleString()}</div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        {post.text || "Nội dung hình ảnh/video..."}
                                                    </div>

                                                    {!!post.moderation?.reasons?.length && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {post.moderation.reasons.map((reason) => (
                                                                <span key={reason} className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest">
                                                                    {getModerationLabel(reason)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            onClick={() => reviewModerationPost({ postId: post._id, action: "approve" })}
                                                            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                                        >
                                                            Duyệt bài
                                                        </button>
                                                        <button
                                                            onClick={() => reviewModerationPost({ postId: post._id, action: "delete" })}
                                                            className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                                        >
                                                            Xóa bài
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-red-500/10 text-red-500"><AlertTriangle size={16} /></div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Báo cáo thủ công</h3>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{reports?.length || 0} báo cáo</span>
                                    </div>

                                    {reportsLoading ? <LoadingSpinner /> : reports?.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 opacity-60">
                                            <CheckCircle2 size={40} className="text-slate-300 mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Không có báo cáo nào</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {reports?.map((report) => (
                                                <div key={report._id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] flex flex-col gap-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 rounded-xl bg-red-500/10 text-red-500"><AlertTriangle size={16} /></div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">{report.reason}</span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: #{report._id.slice(-6)}</span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center gap-2 text-xs font-bold italic text-slate-900 dark:text-white">
                                                            <span>Báo cáo bởi: @{report.reporter?.username}</span>
                                                        </div>
                                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 italic text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                            &quot;{report.post?.text || "Nội dung hình ảnh/video..."}&quot;
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button 
                                                            onClick={() => resolveReport({ reportId: report._id, status: "dismissed", actionTaken: "ignore" })}
                                                            className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Bỏ qua
                                                        </button>
                                                        <button 
                                                            onClick={() => resolveReport({ reportId: report._id, status: "resolved", actionTaken: "deleteContent" })}
                                                            className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                                        >
                                                            Gỡ nội dung
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                        {activeSection === "logs" && (
                            <div className="bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Audit Trail</h3>
                                    <Filter size={16} className="text-slate-400" />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-950/40 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                <th className="px-6 py-4">Admin</th>
                                                <th className="px-6 py-4">Action</th>
                                                <th className="px-6 py-4">Target</th>
                                                <th className="px-6 py-4">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {logsLoading ? <tr><td colSpan="4" className="text-center p-10"><LoadingSpinner /></td></tr> : logs?.map((log) => (
                                                <tr key={log._id} className="text-xs group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <img src={log.adminId?.profileImg || "/avatar-placeholder.png"} className="w-6 h-6 rounded-lg opacity-80" />
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">@{log.adminId?.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 uppercase tracking-tighter">
                                                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                                                            log.action.includes('delete') ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                                                        }`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 font-medium">{log.targetType}: {log.targetId?.slice(-6)}</td>
                                                    <td className="px-6 py-4 text-slate-400 flex items-center gap-1.5"><Clock size={12} /> {new Date(log.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeSection === "settings" && (
                            <div className="max-w-3xl space-y-6">
                                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm space-y-8">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white italic">Cài đặt Nhanh</h3>
                                        <p className="text-xs text-slate-500">Bật hoặc tắt các chế độ quan trọng của hệ thống.</p>
                                    </div>

                                    <div className="space-y-5">
                                        <button
                                            type="button"
                                            onClick={() => handleQuickToggle("maintenanceMode")}
                                            className="w-full flex items-center justify-between gap-4 rounded-2xl p-4 text-left bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-orange-400/40 transition-all"
                                        >
                                            <div className="space-y-1">
                                                <div className="text-base font-bold text-slate-900 dark:text-white">Chế độ Bảo trì</div>
                                                <div className="text-sm text-slate-500">Chặn người dùng đăng nhập</div>
                                            </div>
                                            <div className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${localConfig.maintenanceMode ? "bg-orange-400" : "bg-slate-300 dark:bg-slate-700"}`}>
                                                <span
                                                    className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${localConfig.maintenanceMode ? "translate-x-7" : "translate-x-1"}`}
                                                />
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleQuickToggle("allowRegistration")}
                                            className="w-full flex items-center justify-between gap-4 rounded-2xl p-4 text-left bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-400/40 transition-all"
                                        >
                                            <div className="space-y-1">
                                                <div className="text-base font-bold text-slate-900 dark:text-white">Mở Đăng ký mới</div>
                                                <div className="text-sm text-slate-500">Cho phép tạo tài khoản</div>
                                            </div>
                                            <div className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${localConfig.allowRegistration ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                                                <span
                                                    className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${localConfig.allowRegistration ? "translate-x-7" : "translate-x-1"}`}
                                                />
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] space-y-8">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white italic">Global Constraints</h3>
                                        <p className="text-xs text-slate-500">Cấu hình giới hạn hệ thống.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Post Threshold</label>
                                            <input 
                                                type="number" 
                                                value={localConfig.postThreshold} 
                                                onChange={(e) => setLocalConfig(prev => ({ ...prev, postThreshold: parseInt(e.target.value) || 0 }))}
                                                className="w-full h-14 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-sm font-bold outline-none focus:border-indigo-500 transition-all" 
                                            />
                                            <p className="text-[11px] text-slate-400">Ngưỡng kỹ thuật cho các tác vụ nội bộ.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">User Max Cache</label>
                                            <input 
                                                type="text" 
                                                value={localConfig.userMaxCache} 
                                                onChange={(e) => setLocalConfig(prev => ({ ...prev, userMaxCache: e.target.value }))}
                                                className="w-full h-14 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-sm font-bold outline-none focus:border-indigo-500 transition-all" 
                                            />
                                            <p className="text-[11px] text-slate-400">Ví dụ: 512MB, 1GB, 2GB.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                        <button 
                                            onClick={() => updateConfig(localConfig)}
                                            disabled={updatingConfig}
                                            className="inline-flex items-center justify-center px-5 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-[0.18em] shadow-lg shadow-slate-950/10 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {updatingConfig ? "Đang lưu..." : "Save Changes"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Emergency Stop Modal */}
            <AnimatePresence>
                {showEmergencyModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEmergencyModal(false)}
                            className="absolute inset-0 bg-slate-900/90" 
                        />
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.98, opacity: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="relative bg-white dark:bg-slate-950 w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-red-500/20"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="p-4 bg-red-500/10 rounded-full text-red-500 border border-red-500/20">
                                        <AlertTriangle size={40} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Cảnh Báo Khẩn Cấp</h3>
                                        <p className="text-sm text-slate-500 mt-2 font-medium">Bạn có chắc chắn muốn <span className="text-red-500 font-bold">Dừng Hoạt Động</span> toàn hệ thống? Việc này sẽ đóng băng mọi luồng dữ liệu.</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 mt-4">
                                    <button 
                                        onClick={() => toggleEmergency()}
                                        disabled={togglingEmergency}
                                        className={`w-full py-3.5 rounded-2xl text-white font-black uppercase tracking-widest text-xs hover:bg-red-600 active:scale-95 transition-all shadow-lg ${config?.emergencyStop ? "bg-amber-500 shadow-amber-500/20" : "bg-red-500 shadow-red-500/20"} disabled:opacity-50`}
                                    >
                                        {togglingEmergency ? "Đang xử lý..." : (config?.emergencyStop ? "Tắt Emergency" : "Kích hoạt Emergency")}
                                    </button>
                                    <button 
                                        onClick={() => setShowEmergencyModal(false)}
                                        className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Hủy Bỏ
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPage;
