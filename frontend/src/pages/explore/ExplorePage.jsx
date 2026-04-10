import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Masonry from "react-masonry-css";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Camera,
    Compass,
    Cpu,
    Heart,
    MessageCircle,
    Plane,
    TrendingUp,
} from "lucide-react";

import PostSkeleton from "../../components/skeletons/PostSkeleton";

const CATEGORIES = [
    { id: "all", label: "Dành cho bạn", icon: <Compass size={16} /> },
    { id: "trending", label: "Xu hướng", icon: <TrendingUp size={16} /> },
    { id: "photography", label: "Nhiếp ảnh", icon: <Camera size={16} /> },
    { id: "tech", label: "Công nghệ", icon: <Cpu size={16} /> },
    { id: "travel", label: "Du lịch", icon: <Plane size={16} /> },
];

const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 2, // 2 columns on mobile for better density
};

const ExplorePage = () => {
    const [selectedCategory, setSelectedCategory] = useState("all");

    const { data: posts, isLoading } = useQuery({
        queryKey: ["explorePosts", selectedCategory],
        queryFn: async () => {
            const res = await fetch(`/api/posts/explore?category=${selectedCategory}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Không thể tải dữ liệu");
            return data;
        },
    });

    return (
        <div className="flex-[4_4_0] min-h-screen pb-20">
            <div className="sticky top-0 z-30 bg-white dark:bg-slate-950 border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-4">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-300 text-sm font-bold ${
                                selectedCategory === cat.id
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                                    : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                            }`}
                        >
                            {cat.icon}
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-1 sm:p-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                    </div>
                ) : (
                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="flex w-auto gap-1 sm:gap-6"
                        columnClassName="bg-clip-padding flex flex-col gap-1 sm:gap-6"
                    >
                        {posts?.map((post, idx) => (
                            <motion.div
                                key={post._id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.02 }}
                                className="group relative rounded-xl sm:rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
                            >
                                <Link to={`/post/${post._id}`}>
                                    <div className="relative aspect-auto">
                                        <img
                                            src={post.imgs?.[0] || post.img || "/placeholder-image.png"}
                                            alt=""
                                            className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                            decoding="async"
                                        />

                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white">
                                            <div className="flex items-center gap-2 font-bold scale-90 group-hover:scale-100 transition-transform">
                                                <Heart size={20} fill="currentColor" />
                                                <span>{post.reactionCount || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-2 font-bold scale-90 group-hover:scale-100 transition-transform">
                                                <MessageCircle size={20} fill="currentColor" />
                                                <span>{post.commentCount || 0}</span>
                                            </div>
                                        </div>

                                        {(post.imgs?.length > 1) && (
                                            <div className="absolute top-3 right-3 p-1.5 bg-black/40 rounded-lg text-white border border-white/10">
                                                <div className="flex gap-0.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                                    <Link to={`/profile/${post.user.username}`} className="flex items-center gap-2 overflow-hidden">
                                        <img
                                            src={post.user.profileImg || "/avatar-placeholder.png"}
                                            className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                                            loading="lazy"
                                        />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate tracking-tight">
                                            {post.user.fullName}
                                        </span>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </Masonry>
                )}

                {!isLoading && posts?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Compass size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium italic">Không có nội dung nào trong danh mục này.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExplorePage;
