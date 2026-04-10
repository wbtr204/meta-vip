import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { 
    UserX, 
    UserCheck, 
    ShieldAlert, 
    Trash2,
    Search,
    ShieldCheck,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

const UserTable = ({ users, total, searchTerm, setSearchTerm, page, setPage }) => {
    const queryClient = useQueryClient();
    const limit = 10;
    const totalPages = Math.ceil((total || 0) / limit);

    const { mutate: updateStatus } = useMutation({
        mutationFn: async ({ userId, role, isBanned }) => {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, isBanned }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Update failed");
            return data;
        },
        onSuccess: () => {
            toast.success("Cập nhật trạng thái thành công");
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            queryClient.invalidateQueries({ queryKey: ["adminLogs"] });
        },
        onError: (error) => toast.error(error.message),
    });

    const { mutate: deleteUser } = useMutation({
        mutationFn: async (userId) => {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Delete failed");
            return data;
        },
        onSuccess: () => {
            toast.success("Đã xóa người dùng vĩnh viễn");
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            queryClient.invalidateQueries({ queryKey: ["adminLogs"] });
        },
        onError: (error) => toast.error(error.message),
    });

    const handleDelete = (user) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn người dùng @${user.username}? Hành động này không thể hoàn tác.`)) {
            deleteUser(user._id);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                    <h3 className="font-black text-slate-900 dark:text-slate-100 italic uppercase tracking-tight">Quản lý tài khoản</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Database Synchronization</p>
                </div>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm trong 200+ tài khoản..." 
                        className="pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none w-full sm:w-80 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-5">Người dùng</th>
                            <th className="px-6 py-5">Vai trò</th>
                            <th className="px-6 py-5">Trạng thái</th>
                            <th className="px-6 py-5">Ngày tham gia</th>
                            <th className="px-6 py-5 text-right">Điều khiển</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {users?.map((user) => (
                            <tr key={user._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/60 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-11 w-11 rounded-2xl overflow-hidden ring-4 ring-slate-100 dark:ring-slate-900 shadow-sm shrink-0">
                                            <img src={user.profileImg || "/avatar-placeholder.png"} className="h-full w-full object-cover" loading="lazy" />
                                        </div>
                                        <div className="truncate">
                                            <p className="font-black text-slate-900 dark:text-slate-100 text-[13px] italic truncate">{user.fullName}</p>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">@{user.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${
                                        user.role === 'admin' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" : 
                                        user.role === 'moderator' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                                        "bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-800"
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border ${
                                        user.isBanned 
                                        ? "bg-red-500/5 border-red-500/10 text-red-500" 
                                        : "bg-emerald-500/5 border-emerald-500/10 text-emerald-500"
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${user.isBanned ? "bg-red-500 animate-pulse" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{user.isBanned ? "Đã khóa" : "Hoạt động"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-[12px] text-slate-500 font-bold tracking-tight">
                                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 transition-all duration-300">
                                        {user.role !== 'admin' ? (
                                            <>
                                                <button 
                                                    onClick={() => updateStatus({ userId: user._id, isBanned: !user.isBanned })}
                                                    className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-90 ${user.isBanned ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500"}`}
                                                    title={user.isBanned ? "Mở khóa" : "Khóa người dùng"}
                                                >
                                                    {user.isBanned ? <UserCheck size={16} strokeWidth={2.5} /> : <UserX size={16} strokeWidth={2.5} />}
                                                </button>
                                                <button 
                                                    onClick={() => updateStatus({ userId: user._id, role: user.role === 'user' ? 'moderator' : 'user' })}
                                                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500 transition-all shadow-sm active:scale-90"
                                                    title="Đổi vai trò"
                                                >
                                                    {user.role === 'moderator' ? <ShieldCheck size={16} strokeWidth={2.5} /> : <ShieldAlert size={16} strokeWidth={2.5} />}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(user)}
                                                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    <Trash2 size={16} strokeWidth={2.5} />
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest px-3">Protected</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Hiển thị <span className="text-slate-900 dark:text-white">{(page - 1) * limit + 1} - {Math.min(page * limit, total)}</span> trong tổng số <span className="text-slate-900 dark:text-white">{total || 0}</span> kết quả
                </p>
                <div className="flex items-center gap-2">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-90"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black tracking-widest">
                        TRANG {page}
                    </div>
                    <button 
                        disabled={page >= totalPages}
                        onClick={() => setPage(prev => prev + 1)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-90"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {!users?.length && (
                <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-300">
                        <Search size={32} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest italic">Không tìm thấy kết quả nào</p>
                </div>
            )}
        </div>
    );
};

export default UserTable;
