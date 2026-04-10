import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
    User, 
    Lock, 
    Palette, 
    LogOut,
    Check,
    Mail,
    KeyRound,
    Shield
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";
import useLogout from "../../hooks/useLogout";

// --- VALIDATION SCHEMAS ---
const emailSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
});

// --- SETTINGS PAGE COMPONENT ---
const SettingsPage = ({ theme, setTheme }) => {
    const [activeTab, setActiveTab] = useState("account");
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Queries & Mutations
    const { data: authUser, isLoading } = useQuery({ queryKey: ["authUser"] });
    const { updateProfile, isUpdatingProfile } = useUpdateUserProfile();
    const { logout, isLoggingOut } = useLogout();

    // Forms
    const { 
        register: registerEmail, 
        handleSubmit: handleEmailSubmit, 
        formState: { errors: emailErrors } 
    } = useForm({
        resolver: zodResolver(emailSchema),
        values: { email: authUser?.email || "" }
    });

    const { 
        register: registerPassword, 
        handleSubmit: handlePasswordSubmit, 
        formState: { errors: pwdErrors }, 
        reset: resetPassword 
    } = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
    });

    // Handlers
    const onUpdateEmail = async (data) => {
        if (data.email === authUser?.email) {
            toast.error("Vui lòng nhập một email mới!");
            return;
        }
        await updateProfile({ email: data.email });
    };

    const onUpdatePassword = async (data) => {
        if (data.currentPassword === data.newPassword) {
            toast.error("Mật khẩu mới phải khác mật khẩu hiện tại!");
            return;
        }
        await updateProfile({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword
        });
        resetPassword();
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
            <LoadingSpinner size="lg" />
        </div>
    );

    const tabs = [
        { id: "account", label: "Tài khoản", icon: User },
        { id: "security", label: "Bảo mật", icon: Lock },
        { id: "privacy", label: "Quyền riêng tư", icon: Shield },
        { id: "appearance", label: "Giao diện", icon: Palette },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 md:px-8">
            {/* LEFT COLUMN: NAVIGATION */}
            <aside className="w-full md:w-64 lg:w-72 flex flex-col gap-2 shrink-0">
                <div className="px-2 mb-4">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cài đặt</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý hệ thống của bạn</p>
                </div>
                
                <nav className="flex flex-col gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 text-left font-semibold text-sm ${
                                    active 
                                    ? "bg-slate-200/50 dark:bg-slate-800 text-slate-900 dark:text-white" 
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                                }`}
                            >
                                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-200/50 dark:border-slate-800/50 mt-8">
                    <button 
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors active:scale-95"
                    >
                        <LogOut size={18} strokeWidth={2.5} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* RIGHT COLUMN: MAIN CONTENT */}
            <main className="flex-1 max-w-2xl">
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50 p-6 md:p-8 min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-8"
                        >
                            {/* --- TAB 1: TÀI KHOẢN (ACCOUNT) --- */}
                            {activeTab === "account" && (
                                <div className="space-y-8">
                                    <header>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tài khoản & Email</h2>
                                        <p className="text-slate-500 text-sm mt-1">Sử dụng địa chỉ email này để đăng nhập và khôi phục tài khoản.</p>
                                    </header>

                                    <form onSubmit={handleEmailSubmit(onUpdateEmail)} className="space-y-4 max-w-md">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                                <Mail size={14} /> Điạ chỉ Email
                                            </label>
                                            <input 
                                                {...registerEmail("email")}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-shadow"
                                                placeholder="bạn@example.com"
                                            />
                                            {emailErrors.email && <span className="text-xs text-red-500 font-medium">{emailErrors.email.message}</span>}
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={isUpdatingProfile}
                                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm px-6 py-2.5 rounded-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isUpdatingProfile ? <LoadingSpinner size="sm" /> : "Cập nhật Email"}
                                        </button>
                                    </form>
                                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                                        <p className="text-sm text-slate-500">Để chỉnh sửa Ảnh đại diện, Tên, hay Tiểu sử, vui lòng truy cập <a href={`/profile/${authUser?.username}`} className="text-indigo-500 font-medium hover:underline">Trang Cá Nhân</a> của bạn.</p>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB 3: QUYỀN RIÊNG TƯ (PRIVACY) --- */}
                            {activeTab === "privacy" && (
                                <div className="space-y-8">
                                    <header>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kiểm soát quyền riêng tư</h2>
                                        <p className="text-slate-500 text-sm mt-1">Quản lý những ai có thể xem nội dung và tương tác với tài khoản của bạn.</p>
                                    </header>

                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Tài khoản riêng tư</span>
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed pr-4">
                                                    Chỉ những người bạn phê duyệt mới có thể xem ảnh, video và danh sách bạn bè của bạn.
                                                </p>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="toggle toggle-primary toggle-lg" 
                                                checked={authUser?.isPrivate || false}
                                                onChange={(e) => updateProfile({ isPrivate: e.target.checked })}
                                                disabled={isUpdatingProfile}
                                            />
                                        </div>
                                        
                                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-start gap-3">
                                            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                                <Shield size={14} />
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-bold leading-normal">
                                                Lưu ý: Mọi yêu cầu theo dõi sẽ xuất hiện trong mục Thông báo của bạn để bạn phê duyệt thủ công.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB 2: BẢO MẬT (SECURITY) --- */}
                            {activeTab === "security" && (
                                <div className="space-y-8">
                                    <header>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Thay đổi mật khẩu</h2>
                                        <p className="text-slate-500 text-sm mt-1">Đảm bảo mật khẩu của bạn đủ dài và khó đoán để bảo vệ tài khoản.</p>
                                    </header>

                                    <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="space-y-5 max-w-md">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                                <KeyRound size={14} /> Mật khẩu hiện tại
                                            </label>
                                            <input 
                                                type="password"
                                                {...registerPassword("currentPassword")}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-shadow"
                                            />
                                            {pwdErrors.currentPassword && <span className="text-xs text-red-500 font-medium">{pwdErrors.currentPassword.message}</span>}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Mật khẩu mới</label>
                                            <input 
                                                type="password"
                                                {...registerPassword("newPassword")}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-shadow"
                                            />
                                            {pwdErrors.newPassword && <span className="text-xs text-red-500 font-medium">{pwdErrors.newPassword.message}</span>}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Xác nhận mật khẩu mới</label>
                                            <input 
                                                type="password"
                                                {...registerPassword("confirmPassword")}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-shadow"
                                            />
                                            {pwdErrors.confirmPassword && <span className="text-xs text-red-500 font-medium">{pwdErrors.confirmPassword.message}</span>}
                                        </div>
                                        
                                        <button 
                                            type="submit" 
                                            disabled={isUpdatingProfile}
                                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm px-6 py-2.5 rounded-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2 mt-2"
                                        >
                                            {isUpdatingProfile ? <LoadingSpinner size="sm" /> : "Đổi mật khẩu"}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* --- TAB 3: GIAO DIỆN (APPEARANCE) --- */}
                            {activeTab === "appearance" && (
                                <div className="space-y-8">
                                    <header>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chế độ giao diện</h2>
                                        <p className="text-slate-500 text-sm mt-1">Chuyển đổi các bộ hình nền sáng tối khác nhau.</p>
                                    </header>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { id: "cupcake", label: "Chế độ Sáng", bg: "bg-white", border: "border-slate-200", isDark: false },
                                            { id: "vibenet", label: "Chế độ Tối", bg: "bg-slate-950", border: "border-slate-800", isDark: true },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    setTheme(t.id);
                                                    toast.success(`Đã đổi sang giao diện ${t.label}`);
                                                }}
                                                className={`group p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3 ${
                                                    theme === t.id 
                                                    ? "border-indigo-500 ring-1 ring-indigo-500 cursor-default bg-slate-100/50 dark:bg-slate-900/50" 
                                                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-transparent"
                                                }`}
                                            >
                                                <div className={`w-full aspect-video rounded-lg ${t.bg} border ${t.border} flex items-center justify-center relative overflow-hidden shadow-sm`}>
                                                    {/* Fake UI Preview inside */}
                                                    <div className="absolute left-2 top-2 bottom-2 w-1/4 rounded bg-slate-200/50 dark:bg-slate-800/50 flex flex-col gap-1 p-1">
                                                        <div className="w-full h-2 rounded-sm bg-slate-300 dark:bg-slate-700"></div>
                                                        <div className="w-1/2 h-2 rounded-sm bg-slate-300 dark:bg-slate-700"></div>
                                                    </div>
                                                    <div className="absolute right-2 top-2 bottom-2 w-2/3 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
                                                        <div className="w-full h-3 rounded-sm bg-indigo-500/80 mb-2"></div>
                                                        <div className="w-3/4 h-2 rounded-sm bg-slate-300 dark:bg-slate-700"></div>
                                                    </div>

                                                    {theme === t.id && (
                                                        <div className="absolute bottom-2 right-2 bg-indigo-500 text-white rounded-full p-1 shadow-md">
                                                            <Check size={12} strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-left font-bold text-sm text-slate-900 dark:text-white">
                                                    {t.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* LOGOUT MODAL */}
            <AnimatePresence>
                {showLogoutModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutModal(false)}
                            className="absolute inset-0 bg-slate-900/60" 
                        />
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.98, opacity: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
                        >
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-red-500">
                                    <LogOut size={24} />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Đăng xuất?</h3>
                                </div>
                                <p className="text-slate-500 text-sm">Bạn sẽ cần sử dụng email và mật khẩu để đăng nhập lại hệ thống nhằm xem thông báo và bạn bè.</p>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button 
                                        onClick={() => setShowLogoutModal(false)}
                                        className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        onClick={() => {
                                            logout();
                                            setShowLogoutModal(false);
                                        }}
                                        disabled={isLoggingOut}
                                        className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center min-w-[100px]"
                                    >
                                        {isLoggingOut ? <LoadingSpinner size="sm" /> : "Đăng xuất"}
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

export default SettingsPage;
