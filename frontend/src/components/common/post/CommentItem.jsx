import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { formatPostDate } from "../../../utils/date";
import { Reply, MoreHorizontal, Heart } from "lucide-react";

const CommentItem = memo(function CommentItem({ comment, allComments, onReply, authUser }) {
    const [isLiked, setIsLiked] = useState(false);
    
    const children = allComments?.filter(c => c.parentId === comment._id) || [];
    const formattedDate = formatPostDate(comment.createdAt);

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
                        <button className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 opacity-0 group-hover/comment:opacity-100">
                            <MoreHorizontal size={14} />
                        </button>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                        {comment.text}
                    </p>

                    <div className="flex items-center gap-4 mt-2">
                        <button 
                            onClick={() => setIsLiked(!isLiked)}
                            className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${
                                isLiked ? "text-pink-500" : "text-slate-500 hover:text-pink-500"
                            }`}
                        >
                            <Heart size={12} fill={isLiked ? "currentColor" : "none"} />
                            <span>12</span>
                        </button>

                        <button 
                            onClick={() => onReply(comment)}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-500 transition-colors"
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
                            authUser={authUser}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

export default CommentItem;
