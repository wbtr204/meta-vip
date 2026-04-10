import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatPostDate } from "../../../utils/date";
import { Reply, MoreHorizontal, Heart, Trash2 } from "lucide-react";

const CommentItem = memo(function CommentItem({ comment, allComments, onReply, onDelete, authUser, postOwnerId, postId }) {
    const queryClient = useQueryClient();
    const children = allComments?.filter(c => c.parentId === comment._id) || [];
    const formattedDate = formatPostDate(comment.createdAt);

    // Local state for optimistic like/unlike
    const [localIsLiked, setLocalIsLiked] = useState(false);
    const [localLikeCount, setLocalLikeCount] = useState(0);

    // Sync local state with props when comment data changes
    useEffect(() => {
        const userIdStr = authUser?._id?.toString();
        const liked = comment.likes?.some(id => id.toString() === userIdStr) ?? false;
        setLocalIsLiked(liked);
        setLocalLikeCount(comment.likes?.length || 0);
    }, [comment.likes, authUser?._id]);

    const { mutate: likeUnlikeComment } = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/posts/comment/${postId}/${comment._id}/like`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        onMutate: () => {
            // Optimistic update - immediately toggle UI
            setLocalIsLiked(prev => !prev);
            setLocalLikeCount(prev => localIsLiked ? prev - 1 : prev + 1);
        },
        onSuccess: () => {
            // Background sync to ensure consistency
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["post", postId] });
        },
        onError: () => {
            // Revert optimistic update on error
            setLocalIsLiked(prev => !prev);
            setLocalLikeCount(prev => localIsLiked ? prev + 1 : prev - 1);
        },
    });

    const canDelete = authUser?._id === comment.user?._id || authUser?._id === postOwnerId;

    return (
        <div className="flex flex-col w-full group/comment">
            <div className="flex gap-3 items-start relative">
                {/* Thread line for children */}
                {children.length > 0 && (
                    <div className="absolute left-[18px] top-10 bottom-0 w-[1.5px] bg-slate-100 dark:bg-slate-800" />
                )}

                <Link to={`/profile/${comment.user?.username}`} className="shrink-0 z-10">
                    <div className="h-9 w-9 rounded-xl overflow-hidden ring-2 ring-slate-50 dark:ring-slate-900">
                        <img 
                            src={comment.user?.profileImg || "/avatar-placeholder.png"} 
                            className="w-full h-full object-cover" 
                            alt="avatar" 
                        />
                    </div>
                </Link>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link to={`/profile/${comment.user?.username}`} className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline">
                                {comment.user?.fullName}
                            </Link>
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                • {formattedDate}
                            </span>
                        </div>
                        {canDelete && (
                            <div className="dropdown dropdown-end opacity-0 group-hover/comment:opacity-100">
                                <button tabIndex={0} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
                                    <MoreHorizontal size={14} />
                                </button>
                                <ul tabIndex={0} className="dropdown-content z-20 menu p-2 shadow-xl bg-white dark:bg-slate-900 rounded-xl w-32 border border-slate-100 dark:border-slate-800">
                                    <li>
                                        <button onClick={() => onDelete(comment._id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2">
                                            <Trash2 size={14} />
                                            Xoá
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                        {comment.text}
                    </p>

                    <div className="flex items-center gap-4 mt-2">
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                likeUnlikeComment();
                            }}
                            className={`flex items-center gap-1 text-[11px] font-bold transition-colors border-none outline-none shadow-none bg-transparent appearance-none ${
                                localIsLiked ? "text-pink-500" : "text-slate-500 hover:text-pink-500"
                            }`}
                        >
                            <Heart size={12} fill={localIsLiked ? "currentColor" : "none"} />
                            <span>{localLikeCount > 0 ? localLikeCount : ""}</span>
                        </button>

                        <button 
                            type="button"
                            onClick={() => onReply(comment)}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-500 transition-colors border-none outline-none shadow-none bg-transparent appearance-none"
                        >
                            <Reply size={12} />
                            <span>Phản hồi</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Nested Comments (Replies) */}
            {children.length > 0 && (
                <div className="mt-4 pl-10 flex flex-col gap-4">
                    {children.map((child) => (
                        <CommentItem 
                            key={child._id} 
                            comment={child} 
                            allComments={allComments}
                            onReply={onReply}
                            onDelete={onDelete}
                            authUser={authUser}
                            postOwnerId={postOwnerId}
                            postId={postId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

export default CommentItem;

