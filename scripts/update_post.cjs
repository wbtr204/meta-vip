const fs = require('fs');
let text = fs.readFileSync('frontend/src/components/common/Post.jsx', 'utf8');
const startIndex = text.indexOf('<dialog id={`comments_modal');
const endIndex = text.indexOf('</dialog>') + 9;
const oldBlock = text.substring(startIndex, endIndex);

const newBlock = `<dialog id={\`comments_modal\${post._id}\`} className='modal backdrop-brightness-50'>
\t\t\t\t<div className='modal-box bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-0 max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]'>
\t\t\t\t\t<div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
\t\t\t\t\t\t<h3 className='font-bold text-lg text-slate-900 dark:text-slate-100 italic'>Cuộc hội thoại</h3>
\t\t\t\t\t\t<form method="dialog"><button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Trash2 size={18} className="rotate-45" /></button></form>
\t\t\t\t\t</div>

\t\t\t\t\t<div className='flex-1 flex flex-col overflow-y-auto custom-scrollbar relative bg-white dark:bg-slate-900'>
                        {/* BÀI VIẾT GỐC */}
                        <div className="flex gap-4 px-6 pt-6 pb-4 relative z-10 w-full">
                            {post.comments?.length > 0 && (
                                <div className="absolute left-[42px] top-16 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 -z-10" />
                            )}
                            <div className="h-10 w-10 shadow-sm rounded-xl overflow-hidden shrink-0">
                                <img src={postOwner?.profileImg || "/avatar-placeholder.png"} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col min-w-0 pb-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{postOwner?.fullName}</span>
                                    <span className="text-[12px] text-slate-500 font-medium">@{postOwner?.username} • {formattedDate}</span>
                                </div>
                                <p className="text-sm text-slate-800 dark:text-slate-200 mt-1.5 leading-relaxed">{post.text}</p>
                                {post.imgs && post.imgs.length > 0 && (
                                    <img src={post.imgs[0]} className="mt-3 max-h-40 w-auto object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                                )}
                            </div>
                        </div>

                        {post.comments?.length > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800/80 mx-6 mb-4 shrink-0" />}

                        {/* DANH SÁCH BÌNH LUẬN */}
                        <div className="flex flex-col gap-6 px-6 pb-6">
                            {post.comments
                                .filter(c => !c.parentId) 
                                .map((c) => (
                                    <CommentItem 
                                        key={c._id} 
                                        comment={c} 
                                        allComments={post.comments} 
                                        onReply={(c) => setReplyTo(c)}
                                        onDelete={(id) => deleteComment(id)}
                                        authUser={authUser}
                                        postOwnerId={postOwner?._id}
                                    />
                                ))
                            }
                        </div>
\t\t\t\t\t</div>

\t\t\t\t\t<form className='p-4 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-3 shrink-0' onSubmit={handleCommentSubmit}>
                        {replyTo && (
                            <div className="flex justify-between items-center bg-indigo-100/70 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold px-3 py-1.5 rounded-lg w-fit ml-[48px]">
                                <span>Đang trả lời {replyTo.user?.fullName}</span>
                                <button type="button" onClick={() => setReplyTo(null)} className="ml-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors">
                                    <Trash2 size={12} className="rotate-45" />
                                </button>
                            </div>
                        )}
                        <div className="flex gap-3 items-center">
                            <div className="h-9 w-9 shadow-sm rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                 <img src={authUser?.profileImg || "/avatar-placeholder.png"} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                            <input 
                                className='flex-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700 rounded-xl py-2 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-transparent outline-none transition-all shadow-sm' 
                                placeholder={replyTo ? \`Viết câu trả lời...\` : 'Thêm bình luận của bạn...'} 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                disabled={isCommenting || !commentText.trim()}
                                className='bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md shadow-indigo-500/20 active:scale-95 flex items-center gap-2'
                            >
                                {isCommenting ? <LoadingSpinner size="xs" /> : <SendHorizonal size={16} />}
                            </button>
                        </div>
\t\t\t\t\t</form>
\t\t\t\t</div>
\t\t\t\t<form method='dialog' className='modal-backdrop bg-black/40'><button>close</button></form>
\t\t\t</dialog>`;

text = text.replace(oldBlock, newBlock);
fs.writeFileSync('frontend/src/components/common/Post.jsx', text);
console.log('Post updated!');
