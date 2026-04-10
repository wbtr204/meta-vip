import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "./LoadingSpinner";

const RightPanel = () => {
    const { data: authUser } = useQuery({ queryKey: ["authUser"] });
    
    // FETCH: Suggested Users
    const { data: suggestedUsers, isLoading: isSuggestionsLoading } = useQuery({
        queryKey: ["suggestedUsers"],
        queryFn: async () => {
            const res = await fetch("/api/users/suggested");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch suggestions");
            return data;
        },
    });

    // FETCH: Trending Hashtags
    const { data: trendingHashtags, isLoading: isTrendingLoading } = useQuery({
        queryKey: ["trendingHashtags"],
        queryFn: async () => {
            const res = await fetch("/api/posts/trending");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch trends");
            return data;
        },
    });

    const { follow, isPending } = useFollow();

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    if (!authUser) return null;

    return (
        <aside className="hidden lg:flex flex-col w-[320px] sticky top-20 h-fit gap-6 transition-all duration-300">
            {/* UNIFIED BENTO CONTAINER */}
            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] overflow-hidden shadow-sm"
            >
                {/* SECTION 1: WHAT'S HAPPENING */}
                <div className="py-4">
                    <div className="flex items-center justify-between mb-2 px-5">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Có gì mới?</h3>
                    </div>
                    <div className="flex flex-col">
                        {isTrendingLoading ? (
                           <div className="space-y-4 px-5 pb-4 mt-2">
                               {[1, 2, 3].map(i => (
                                   <div key={i} className="animate-pulse flex flex-col gap-2">
                                       <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
                                       <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                                       <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                                   </div>
                               ))}
                           </div>
                        ) : (
                            <>
                                {trendingHashtags?.slice(0, 5).map((tag, index) => {
                                    // Phân loại thông minh dựa trên từ khóa của hashtag
                                    const tagText = tag.text.toLowerCase();
                                    let category = "Đang thịnh hành";
                                    
                                    if (tagText.includes("congnghe") || tagText.includes("tech") || tagText.includes("react") || tagText.includes("ai") || tagText.match(/cntt|cyber|update/)) category = "Công nghệ";
                                    else if (tagText.includes("giaitri") || tagText.includes("phim") || tagText.includes("music") || tagText.match(/anime|gaming|concert/)) category = "Giải trí";
                                    else if (tagText.includes("doisong") || tagText.includes("hoctap") || tagText.includes("khoaluan") || tagText.match(/tips|study|job/)) category = "Đời sống";
                                    else if (tagText.includes("khampha") || tagText.includes("travel") || tagText.match(/cafe|dalat|food/)) category = "Khám phá";
                                    else if (tagText.includes("tinnong") || tagText.includes("giaothong") || tagText.includes("thoitiet") || tagText.match(/tuyendung/)) category = "Tin nóng";
                                    
                                    return (
                                        <motion.div key={tag._id} variants={itemVariants}>
                                            <Link
                                                to={`/search?q=${encodeURIComponent('#' + tag.text)}`}
                                                className="flex items-start justify-between py-3 px-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-200 group relative"
                                            >
                                                <div className="flex flex-col min-w-0 pr-4">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                                            {index === 0 && category === "Đang thịnh hành" ? "Thịnh hành toàn cầu" : `${category} · Nổi bật`}
                                                        </span>
                                                    </div>
                                                    <span className="text-[15px] font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 transition-colors truncate">
                                                        #{tag.text}
                                                    </span>
                                                    <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {tag.count > 1000 ? `${(tag.count / 1000).toFixed(1)}K` : tag.count} bài đăng
                                                    </span>
                                                </div>
                                                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 -mr-2 transition-colors opacity-0 group-hover:opacity-100"
                                                     onClick={(e) => { e.preventDefault(); }}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                                {!isTrendingLoading && trendingHashtags?.length > 0 && (
                                    <Link to="/explore" className="block px-5 py-3.5 text-[14px] text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        Hiện thêm
                                    </Link>
                                )}
                            </>
                        )}
                        {!isTrendingLoading && trendingHashtags?.length === 0 && (
                            <p className="text-xs text-slate-400 p-5 pt-0">Hiện chưa có xu hướng nào.</p>
                        )}
                    </div>
                </div>

                {/* SECTION 2: SUGGESTED FOLLOWS */}
                <div className="p-5 pt-4 bg-slate-50/30 dark:bg-slate-800/10 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Gợi ý cho bạn</h3>
                        <Link to="/explore" className="text-[12px] font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                            Xem tất cả
                        </Link>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {isSuggestionsLoading ? (
                            <div className="space-y-4 px-1">
                                {[1, 2].map(i => (
                                    <div key={i} className="animate-pulse flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                            <div className="space-y-2">
                                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20" />
                                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-12" />
                                            </div>
                                        </div>
                                        <div className="w-16 h-7 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            suggestedUsers?.map((user) => (
                                <motion.div 
                                    key={user._id} 
                                    variants={itemVariants}
                                    className="flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Link to={`/profile/${user.username}`} className="shrink-0">
                                            <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-transform active:scale-95">
                                                <img 
                                                    className="w-full h-full object-cover" 
                                                    src={user.profileImg || "/avatar-placeholder.png"} 
                                                    alt={user.fullName} 
                                                    loading="lazy"
                                                />
                                            </div>
                                        </Link>
                                        <div className="flex flex-col overflow-hidden leading-tight">
                                            <Link 
                                                to={`/profile/${user.username}`} 
                                                className="text-[13px] font-bold text-slate-900 dark:text-slate-100 hover:underline decoration-1 underline-offset-2 truncate"
                                            >
                                                {user.fullName}
                                            </Link>
                                            <span className="text-[12px] text-slate-500 truncate lowercase">@{user.username}</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            follow(user._id);
                                        }}
                                        disabled={isPending}
                                        className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ml-2 whitespace-nowrap border
                                            ${user.followRequests?.includes(authUser?._id)
                                                ? "bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 cursor-default"
                                                : "bg-white dark:bg-transparent border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 shadow-sm"
                                            }`}
                                    >
                                        {isPending ? <LoadingSpinner size="sm" /> : (
                                            user.followRequests?.includes(authUser?._id) ? "Chờ" : 
                                            user.isPrivate ? "Yêu cầu" : "Theo dõi"
                                        )}
                                    </button>
                                </motion.div>
                            ))
                        )}
                        {!isSuggestionsLoading && suggestedUsers?.length === 0 && (
                            <p className="text-xs text-slate-400 p-1">Không có gợi ý mới.</p>
                        )}
                    </div>
                </div>
            </motion.div>
            
            {/* FOOTER COHESION */}
            <footer className="flex flex-wrap gap-x-4 gap-y-1 px-4 text-slate-400">
                <a href="#" className="text-[11px] hover:underline">Điều khoản</a>
                <a href="#" className="text-[11px] hover:underline">Quyền riêng tư</a>
                <a href="#" className="text-[11px] hover:underline">Cookies</a>
                <span className="text-[11px]">@2026 Trương Quân Bảo</span>
            </footer>
        </aside>
    );
};

export default RightPanel;
