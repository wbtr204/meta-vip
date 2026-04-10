import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Compass, RefreshCw, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import Posts from "../../components/common/Posts";
import Post from "../../components/common/Post";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import CreatePost from "./CreatePost";
import StoryBar from "../../components/story/StoryBar";

const HomePage = () => {
    const [feedType, setFeedType] = useState("following");
    const [isFollowingEmpty, setIsFollowingEmpty] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const isSavedView = searchParams.get("view") === "saved";

    const { data: savedPosts, isLoading: isSavedLoading } = useQuery({
        queryKey: ["bookmarks"],
        queryFn: async () => {
            const res = await fetch("/api/posts/bookmarks");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        enabled: isSavedView,
    });

    useEffect(() => {
        if (isSavedView) {
            setIsFollowingEmpty(false);
        }
    }, [isSavedView]);

    const handleDataLoad = useCallback(
        (count) => {
            if (feedType === "following") {
                setIsFollowingEmpty(count === 0);
            } else {
                setIsFollowingEmpty(false);
            }
        },
        [feedType]
    );

    const switchToExplore = () => {
        setFeedType("forYou");
        setIsFollowingEmpty(false);
    };

    const exitSavedView = () => {
        setSearchParams({});
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-0 sm:gap-6">
            {!isSavedView && <StoryBar />}
            {!isSavedView && (
                <div className="hidden lg:block">
                    <CreatePost />
                </div>
            )}

            {!isSavedView && (
                <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4 px-4 sm:px-0">
                    <div className="flex gap-6">
                        <button
                            onClick={() => {
                                setFeedType("following");
                                setIsFollowingEmpty(false);
                            }}
                            className={`text-sm font-bold transition-all relative pb-2 flex items-center gap-2 ${
                                feedType === "following" ? "text-indigo-500" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                        >
                            <Users size={16} />
                            Đang theo dõi
                            {feedType === "following" && (
                                <motion.span layoutId="homeTabs" className="absolute bottom-0 left-0 w-full h-[2.5px] bg-indigo-500 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setFeedType("forYou");
                                setIsFollowingEmpty(false);
                            }}
                            className={`text-sm font-bold transition-all relative pb-2 flex items-center gap-2 ${
                                feedType === "forYou" ? "text-indigo-500" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                        >
                            <Compass size={16} />
                            Dành cho bạn
                            {feedType === "forYou" && (
                                <motion.span layoutId="homeTabs" className="absolute bottom-0 left-0 w-full h-[2.5px] bg-indigo-500 rounded-t-full" />
                            )}
                        </button>
                    </div>
                    <button className="hidden sm:flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xs font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                        Tùy chỉnh
                    </button>
                </div>
            )}

            <div className="w-full relative min-h-[400px]">
                <AnimatePresence mode="wait">
                    {isSavedView ? (
                        <motion.div key="saved-feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                            {isSavedLoading ? (
                                <div className="flex justify-center py-16">
                                    <LoadingSpinner size="lg" />
                                </div>
                            ) : savedPosts?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-slate-950 sm:dark:bg-slate-900/50 sm:rounded-3xl rounded-none border-y sm:border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 text-indigo-500">
                                        <Bookmark size={40} strokeWidth={1.5} fill="currentColor" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2 italic">Bạn chưa lưu bài viết nào</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8 text-sm leading-relaxed">
                                        Hãy bấm vào biểu tượng đánh dấu ở bất kỳ bài viết nào để thêm vào bộ sưu tập của bạn.
                                    </p>
                                    <button
                                        onClick={exitSavedView}
                                        className="px-8 py-3 bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-colors active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={18} />
                                        Quay lại bảng tin
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {savedPosts.map((post) => (
                                        <Post key={post._id} post={post} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : isFollowingEmpty ? (
                        <motion.div
                            key="empty-following"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-slate-950 sm:dark:bg-slate-900/50 sm:rounded-3xl rounded-none border-y sm:border border-dashed border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 text-indigo-500">
                                <Users size={40} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2 italic">Dòng thời gian đang chờ bạn...</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8 text-sm leading-relaxed">
                                Bạn chưa theo dõi ai hoặc những người bạn theo dõi chưa có bài đăng mới nào.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={switchToExplore}
                                    className="px-8 py-3 bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-colors active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Compass size={18} />
                                    Khám phá bài viết mới
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={18} />
                                    Làm mới trang
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={feedType}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Posts feedType={feedType} onDataLoad={handleDataLoad} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default HomePage;
