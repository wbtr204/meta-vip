import { memo, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Heart, 
    MessageCircle, 
    Repeat, 
    Share2,
    Bookmark, 
    Trash2, 
    MoreHorizontal, 
    SendHorizonal,
    AlertTriangle
} from "lucide-react";

import LoadingSpinner from "./LoadingSpinner";
import ReactionBar from "./post/ReactionBar";
import ShareMenu from "./post/ShareMenu";
import CommentItem from "./post/CommentItem";
import { formatPostDate } from "../../utils/date";


const Post = memo(function Post({ post }) {
	const [showReactions, setShowReactions] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
	const [commentText, setCommentText] = useState("");
    const [replyTo, setReplyTo] = useState(null); 
	const hoverTimeout = useRef(null);
    const navigate = useNavigate();
	
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const queryClient = useQueryClient();

    const isMyPost = authUser?._id === post.user?._id;
    const isRepost = !!post.repostOf;
    const displayPost = isRepost ? post.repostOf : post;
    const postOwner = displayPost?.user;
    const isFlagged = post.moderation?.status === "flagged";
    
    const myReaction = post.reactions?.find(r => r.user === authUser?._id);
    const isLiked = !!myReaction;
    const isBookmarked = authUser?.bookmarks?.includes(post._id);

    const handleHoverStart = useCallback(() => {
        hoverTimeout.current = setTimeout(() => setShowReactions(true), 400);
    }, []);

    const handleHoverEnd = useCallback(() => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setShowReactions(false);
    }, []);

	const { mutate: deletePost, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/${post._id}`, { method: "DELETE" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		onSuccess: () => {
			toast.success("Đã xóa bài viết");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});

	const { mutate: reactPost } = useMutation({
		mutationFn: async (type) => {
			const res = await fetch(`/api/posts/like/${post._id}`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type })
            });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});

	const { mutate: commentPost, isPending: isCommenting } = useMutation({
		mutationFn: async ({ text, parentId }) => {
			const res = await fetch(`/api/posts/comment/${post._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text, parentId }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		onSuccess: () => {
			setCommentText("");
            setReplyTo(null);
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: () => toast.error("Bình luận thất bại"),
	});

	const { mutate: repostPost } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/repost/${post._id}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		onSuccess: () => {
			toast.success("Hành động đã được thực hiện");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});

	const { mutate: bookmarkPost } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/bookmark/${post._id}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: ["authUser"] });
			await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

			const previousAuthUser = queryClient.getQueryData(["authUser"]);
			const previousBookmarks = queryClient.getQueryData(["bookmarks"]);
			const wasBookmarked = previousAuthUser?.bookmarks?.includes(post._id);

			queryClient.setQueryData(["authUser"], (currentUser) => {
				if (!currentUser) return currentUser;

				const currentBookmarks = currentUser.bookmarks || [];
				return {
					...currentUser,
					bookmarks: wasBookmarked
						? currentBookmarks.filter((bookmarkId) => bookmarkId !== post._id)
						: currentBookmarks.includes(post._id)
							? currentBookmarks
							: [...currentBookmarks, post._id],
				};
			});

			queryClient.setQueryData(["bookmarks"], (currentBookmarks) => {
				if (!Array.isArray(currentBookmarks)) return currentBookmarks;

				if (wasBookmarked) {
					return currentBookmarks.filter((savedPost) => savedPost._id !== post._id);
				}

				if (currentBookmarks.some((savedPost) => savedPost._id === post._id)) {
					return currentBookmarks;
				}

				return [post, ...currentBookmarks];
			});

			return { previousAuthUser, previousBookmarks, wasBookmarked };
		},
		onError: (_error, _variables, context) => {
			if (context?.previousAuthUser) {
				queryClient.setQueryData(["authUser"], context.previousAuthUser);
			}

			if (typeof context?.previousBookmarks !== "undefined") {
				queryClient.setQueryData(["bookmarks"], context.previousBookmarks);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
		},
	});

	const handleCommentSubmit = (e) => {
		e.preventDefault();
		if (!commentText.trim()) return;
		commentPost({ text: commentText, parentId: replyTo?._id });
	};

	if (!post.user) return null;

	return (
		<motion.article 
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.12, ease: "easeOut" }}
			className='bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 w-full mb-4 overflow-hidden relative'
		>
            <div className='p-4 sm:p-5'>
                {/* Repost Header */}
                {isRepost && (
                    <div className='flex items-center gap-2 mb-3 text-slate-400 font-bold text-[11px] uppercase tracking-wider pl-12'>
                        <Repeat size={12} className="text-emerald-500" />
                        <span>{post.user?.fullName} đã đăng lại</span>
                    </div>
                )}

                <div className='flex gap-3'>
                    {/* AVATAR LEFT AREA */}
                    <div className='flex flex-col items-center shrink-0'>
                        <Link to={`/profile/${postOwner?.username}`} className='group relative'>
                            <div className='h-10 w-10 sm:h-11 sm:w-11 rounded-xl overflow-hidden ring-2 ring-slate-50 dark:ring-slate-900 group-hover:ring-indigo-500/30 transition-all'>
                                <img 
                                    src={postOwner?.profileImg || "/avatar-placeholder.png"} 
                                    className='w-full h-full object-cover transition-transform group-hover:scale-110' 
                                    alt='avatar'
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                        </Link>
                    </div>

                    {/* CONTENT RIGHT AREA */}
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between mb-1'>
                            <div className='flex items-center gap-2 flex-wrap'>
                                <Link to={`/profile/${postOwner?.username}`} className='font-bold text-slate-900 dark:text-slate-100 hover:underline leading-tight italic'>
                                    {postOwner?.fullName}
                                </Link>
                                <span className='text-xs text-slate-500 font-medium'>
                                    @{postOwner?.username} • {formatPostDate(displayPost.createdAt)}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                {isMyPost && !isRepost && (
                                    <button 
                                        onClick={() => deletePost()}
                                        disabled={isDeleting}
                                        className='p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-all'
                                    >
                                        {isDeleting ? <LoadingSpinner size='xs' /> : <Trash2 size={16} />}
                                    </button>
                                )}
                                <button className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                        </div>

                        {isFlagged && (isMyPost || authUser?.role === "admin") && (
                            <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest">
                                <AlertTriangle size={12} />
                                <span>Đang kiểm duyệt</span>
                            </div>
                        )}

                        <div 
                            className='cursor-pointer'
                            onClick={() => navigate(`/post/${post._id}`)}
                        >
                            <p className='text-slate-800 dark:text-slate-200 leading-relaxed mb-3 text-[15px]'>
                                {displayPost.text?.split(/(\s+)/).map((word, i) => {
                                    if (word.startsWith("#")) {
                                        return (
                                            <Link 
                                                key={i} 
                                                to={`/search?q=${encodeURIComponent(word.substring(1))}`}
                                                className="text-indigo-500 font-bold hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {word}
                                            </Link>
                                        );
                                    }
                                    return word;
                                })}
                            </p>
                        </div>

                        {/* Location Badge */}
                        {displayPost.location && (
                            <div className="flex items-center gap-1.5 mb-3 text-slate-400 font-bold text-[11px] uppercase tracking-wider pl-1">
                                <span className="material-symbols-outlined text-[12px] text-indigo-500">location_on</span>
                                <span>tại {displayPost.location}</span>
                            </div>
                        )}

                        {/* Images Grid */}
                        {(displayPost.img || displayPost.imgs?.length > 0) && (
                            <div className={`grid gap-2 rounded-2xl overflow-hidden mb-4 border border-slate-100 dark:border-slate-800/50 ${
                                displayPost.imgs?.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                            }`}>
                                {(displayPost.imgs || [displayPost.img]).map((img, i) => (
                                    <div key={i} className={`overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video`}>
                                        <img 
                                            src={img} 
                                            className='w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer' 
                                            alt='Post visual' 
                                            loading="lazy"
                                            decoding="async"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ACTIONS TOOLBAR */}
                        <div className='mt-4 pt-4 border-t border-slate-100/80 dark:border-slate-800/70 flex items-center justify-between gap-3'>
                            <div className='flex items-center gap-1.5 sm:gap-3 min-w-0'>
                                <div 
                                    className="relative flex items-center"
                                    onMouseEnter={handleHoverStart}
                                    onMouseLeave={handleHoverEnd}
                                >
                                    <button 
                                        type="button"
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 ${
                                            isLiked ? "bg-red-500/10 text-red-500" : "text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                                        }`}
                                        onClick={() => !isLiked ? reactPost("like") : reactPost()}
                                        aria-label="Thích bài viết"
                                    >
                                        <Heart
                                            size={20}
                                            fill={isLiked ? "currentColor" : "none"}
                                            className={`transition-transform ${isLiked ? "scale-105" : ""}`}
                                        />
                                        <span className='text-xs font-semibold tabular-nums'>{post.reactions?.length || 0}</span>
                                    </button>

                                    <AnimatePresence>
                                        {showReactions && <ReactionBar onSelect={(type) => { reactPost(type); setShowReactions(false); }} />}
                                    </AnimatePresence>
                                </div>
                                
                                <button 
                                    type="button"
                                    className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 transition-all active:scale-95' 
                                    onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
                                    aria-label="Bình luận bài viết"
                                >
                                    <MessageCircle size={20} />
                                    <span className='text-xs font-semibold tabular-nums'>{post.comments?.length || 0}</span>
                                </button>

                                <div className="relative">
                                    <button 
                                        type="button"
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 ${
                                            displayPost.reposts?.length > 0 ? "bg-emerald-500/10 text-emerald-500" : "text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                                        }`}
                                        onClick={() => setShowShareMenu(!showShareMenu)}
                                        aria-label="Chia sẻ bài viết"
                                    >
                                        <Share2 size={20} />
                                        <span className='text-xs font-semibold tabular-nums'>{displayPost.reposts?.length || 0}</span>
                                    </button>
                                    
                                    <AnimatePresence>
                                        {showShareMenu && (
                                            <ShareMenu 
                                                onRepost={repostPost}
                                                onQuote={() => toast("Chức năng Trích dẫn đang được phát triển")}
                                                postUrl={`${window.location.origin}/post/${post._id}`}
                                                onClose={() => setShowShareMenu(false)}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            
                            <button 
                                type="button"
                                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                                    isBookmarked ? "bg-indigo-600/10 text-indigo-600" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-600/10"
                                }`}
                                onClick={() => bookmarkPost()}
                                aria-label="Lưu bài viết"
                            >
                                <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
			<dialog id={`comments_modal${post._id}`} className='modal backdrop-brightness-50'>
				<div className='modal-box bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-0 max-w-xl shadow-2xl overflow-hidden'>
					<div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
						<h3 className='font-bold text-lg text-slate-900 dark:text-slate-100 italic'>Cuộc hội thoại</h3>
						<form method="dialog"><button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Trash2 size={18} className="rotate-45" /></button></form>
					</div>

					<div className='flex flex-col gap-6 max-h-[60vh] overflow-y-auto px-6 py-6 custom-scrollbar'>
                        {post.comments
                            .filter(c => !c.parentId) 
                            .map((c) => (
                                <CommentItem 
                                    key={c._id} 
                                    comment={c} 
                                    allComments={post.comments} 
                                    onReply={(c) => setReplyTo(c)}
                                    authUser={authUser}
                                />
                            ))
                        }
					</div>

					<form className='p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/50 flex gap-3' onSubmit={handleCommentSubmit}>
                        <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                             <img src={authUser?.profileImg || "/avatar-placeholder.png"} className="w-full h-full object-cover" loading="lazy" />
                        </div>
						<input 
							className='flex-1 bg-white dark:bg-slate-800 border-none rounded-xl py-2 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all' 
							placeholder={replyTo ? `Trả lời ${replyTo.user?.fullName}...` : 'Viết suy nghĩ của bạn...'} 
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
						/>
						<button 
							type="submit" 
							disabled={isCommenting || !commentText.trim()}
							className='bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-95 flex items-center gap-2'
						>
							{isCommenting ? <LoadingSpinner size="xs" /> : <SendHorizonal size={16} />}
						</button>
					</form>
				</div>
				<form method='dialog' className='modal-backdrop bg-black/20'><button>close</button></form>
			</dialog>
		</motion.article>
	);
});

export default Post;
