import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, UserMinus, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import useFollow from "../../hooks/useFollow";

const UserListModal = ({ isOpen, onClose, title, userId, endpoint, allowActions = true, showFriendsSection = false }) => {
	const { follow, isPending: isFollowing } = useFollow();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const { data: users, isLoading } = useQuery({
		queryKey: ["userList", endpoint, userId],
		queryFn: async () => {
			if (!userId || !endpoint) return [];
			const res = await fetch(`/api/users/${endpoint}/${userId}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		enabled: isOpen && !!userId && !!endpoint,
	});

	const { data: friends, isLoading: isLoadingFriends } = useQuery({
		queryKey: ["userFriends", userId],
		queryFn: async () => {
			if (!userId) return [];
			const res = await fetch(`/api/users/friends/${userId}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		enabled: isOpen && showFriendsSection && !!userId,
	});

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<div className='fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6'>
				{/* Backdrop */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
					className='absolute inset-0 bg-slate-950/60'
				/>

				{/* Modal Content */}
				<motion.div
					initial={{ opacity: 0, scale: 0.98 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.98 }}
					transition={{ duration: 0.15, ease: "easeOut" }}
					className='relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden flex flex-col max-h-[80vh]'
				>
					{/* Header */}
					<div className='px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10'>
						<h3 className='text-lg font-black text-slate-900 dark:text-white tracking-tight'>
							{title}
						</h3>
						<button
							onClick={onClose}
							className='p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all'
						>
							<X size={20} />
						</button>
					</div>

					{/* List Area */}
					<div className='flex-1 overflow-y-auto no-scrollbar p-2'>
						{isLoading ? (
							<div className='flex justify-center py-12'>
								<LoadingSpinner size='lg' />
							</div>
						) : users?.length === 0 ? (
							<div className='flex flex-col items-center justify-center py-16 text-center px-6'>
								<div className='w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4'>
									<UserIcon size={32} />
								</div>
								<p className='text-slate-500 dark:text-slate-400 font-bold text-sm'>
									Danh sách trống
								</p>
							</div>
						) : (
							<div className='space-y-1'>
								{users?.map((user) => {
									const isMe = authUser?._id === user._id;
									const amIFollowing = authUser?.following?.includes(user._id);

									return (
										<div
											key={user._id}
											className='flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group'
										>
											<Link
												to={`/profile/${user.username}`}
												onClick={onClose}
												className='flex items-center gap-3 flex-1 min-w-0'
											>
												<img
													src={user.profileImg || "/avatar-placeholder.png"}
													className='w-11 h-11 rounded-2xl object-cover border border-slate-100 dark:border-slate-800'
													alt={user.fullName}
												/>
												<div className='flex flex-col min-w-0'>
													<span className='font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors'>
														{user.fullName}
													</span>
													<span className='text-xs text-slate-500 dark:text-slate-400 truncate'>
														@{user.username}
													</span>
												</div>
											</Link>

											{allowActions && !isMe && (
												<button
													onClick={(e) => {
														e.preventDefault();
														follow(user._id);
													}}
													disabled={isFollowing}
													className={`ml-4 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2
														${
															amIFollowing
																? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-500 hover:border-red-100"
																: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-950/10 dark:shadow-none active:scale-95"
														}`}
												>
													{amIFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
													<span className='hidden sm:inline'>
														{amIFollowing ? "Bỏ" : "Theo dõi"}
													</span>
												</button>
											)}
										</div>
									);
								})}
							</div>
						)}

						{showFriendsSection && (
							<div className='mt-4 border-t border-slate-100 dark:border-slate-800 pt-4'>
								<div className='mb-3 px-3'>
									<p className='text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400'>Bạn bè chung</p>
									<p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
										Những người bạn và hồ sơ này theo dõi chéo nhau.
									</p>
								</div>

								{isLoadingFriends ? (
									<div className='flex justify-center py-8'>
										<LoadingSpinner size='md' />
									</div>
								) : friends?.length === 0 ? (
									<div className='rounded-2xl bg-slate-50 dark:bg-slate-800/40 px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400'>
										Chưa có bạn bè chung.
									</div>
								) : (
									<div className='space-y-1'>
										{friends?.map((friend) => {
											const isMe = authUser?._id === friend._id;
											const amIFollowing = authUser?.following?.includes(friend._id);

											return (
												<div
													key={friend._id}
													className='flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group'
												>
													<Link
														to={`/profile/${friend.username}`}
														onClick={onClose}
														className='flex items-center gap-3 flex-1 min-w-0'
													>
														<img
															src={friend.profileImg || "/avatar-placeholder.png"}
															className='w-11 h-11 rounded-2xl object-cover border border-slate-100 dark:border-slate-800'
															alt={friend.fullName}
														/>
														<div className='flex flex-col min-w-0'>
															<span className='font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors'>
																{friend.fullName}
															</span>
															<span className='text-xs text-slate-500 dark:text-slate-400 truncate'>
																@{friend.username}
															</span>
														</div>
													</Link>

													{allowActions && !isMe && (
														<button
															onClick={(e) => {
																e.preventDefault();
																follow(friend._id);
															}}
															disabled={isFollowing}
															className={`ml-4 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2
																${
																	amIFollowing
																		? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-500 hover:border-red-100"
																		: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-950/10 dark:shadow-none active:scale-95"
																}`}
														>
															{amIFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
															<span className='hidden sm:inline'>
																{amIFollowing ? "Bỏ" : "Theo dõi"}
															</span>
														</button>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default UserListModal;
