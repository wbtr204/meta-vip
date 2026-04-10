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
					initial={{ opacity: 0, y: "100%" }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: "100%" }}
					transition={{ type: "spring", damping: 25, stiffness: 200 }}
					className='relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] mt-auto sm:mt-0'
				>
					{/* Mobile Handle */}
					<div className="flex justify-center py-3 sm:hidden">
						<div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
					</div>

					{/* Header */}
					<div className='px-6 py-5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10'>
						<div>
							<h3 className='text-xl font-black text-slate-900 dark:text-white tracking-tight'>
								{title}
							</h3>
						</div>
						<button
							onClick={onClose}
							className='p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all'
						>
							<X size={20} />
						</button>
					</div>

					{/* List Area */}
					<div className='flex-1 overflow-y-auto no-scrollbar p-3'>
						{isLoading ? (
							<div className='flex justify-center py-16'>
								<LoadingSpinner size='lg' />
							</div>
						) : users?.length === 0 ? (
							<div className='flex flex-col items-center justify-center py-20 text-center px-6'>
								<div className='w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6'>
									<UserIcon size={40} />
								</div>
								<p className='text-slate-500 dark:text-slate-400 font-bold'>
									Danh sách chưa có ai
								</p>
							</div>
						) : (
							<div className='space-y-2'>
								{users?.map((user) => {
									const isMe = authUser?._id === user._id;
									const amIFollowing = authUser?.following?.includes(user._id);

									return (
										<div
											key={user._id}
											className='flex items-center justify-between p-3.5 rounded-[1.5rem] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group'
										>
											<Link
												to={`/profile/${user.username}`}
												onClick={onClose}
												className='flex items-center gap-4 flex-1 min-w-0'
											>
												<div className="relative shrink-0">
													<img
														src={user.profileImg || "/avatar-placeholder.png"}
														className='w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-900 shadow-sm'
														alt={user.fullName}
													/>
												</div>
												<div className='flex flex-col min-w-0'>
													<span className='font-black text-[15px] text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors tracking-tight'>
														{user.fullName}
													</span>
													<span className='text-xs font-bold text-indigo-500/70 truncate'>
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
													className={`ml-4 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2
														${
															amIFollowing
																? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 active:scale-95"
																: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95"
														}`}
												>
													{amIFollowing ? "Hủy" : "Theo dõi"}
												</button>
											)}
										</div>
									);
								})}
							</div>
						)}

						{showFriendsSection && (
							<div className='mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 px-2 mb-4'>
								<div className='mb-4'>
									<p className='text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500'>Bạn bè chung</p>
									<p className='mt-1 text-xs font-medium text-slate-500'>
										Những kỷ niệm tương đồng giữa hai bạn
									</p>
								</div>

								{isLoadingFriends ? (
									<div className='flex justify-center py-10'>
										<LoadingSpinner size='md' />
									</div>
								) : friends?.length === 0 ? (
									<div className='rounded-3xl bg-slate-50 dark:bg-slate-800/40 px-6 py-10 text-center text-sm font-medium text-slate-400 italic'>
										Chưa tìm thấy bạn chung nào.
									</div>
								) : (
									<div className='space-y-2'>
										{friends?.map((friend) => {
											const isMe = authUser?._id === friend._id;
											const amIFollowing = authUser?.following?.includes(friend._id);

											return (
												<div
													key={friend._id}
													className='flex items-center justify-between p-3.5 rounded-[1.5rem] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group'
												>
													<Link
														to={`/profile/${friend.username}`}
														onClick={onClose}
														className='flex items-center gap-4 flex-1 min-w-0'
													>
														<img
															src={friend.profileImg || "/avatar-placeholder.png"}
															className='w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-900 shadow-sm'
															alt={friend.fullName}
														/>
														<div className='flex flex-col min-w-0'>
															<span className='font-black text-[15px] text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors tracking-tight'>
																{friend.fullName}
															</span>
															<span className='text-xs font-bold text-indigo-500/70 truncate'>
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
															className={`ml-4 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2
																${
																	amIFollowing
																		? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 active:scale-95"
																		: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95"
																}`}
														>
															{amIFollowing ? "Hủy" : "Theo dõi"}
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
