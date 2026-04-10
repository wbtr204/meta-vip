import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, FileText, Search, Users } from "lucide-react";

import AutocompleteSearch from "../../components/common/AutocompleteSearch";
import Post from "../../components/common/Post";
import PostSkeleton from "../../components/skeletons/PostSkeleton";
import { loadSearchHistory } from "../../utils/searchHistory";

const SearchPage = () => {
	const [searchParams] = useSearchParams();
	const q = searchParams.get("q") || "";
	const query = q.trim();
	const [recentSearches, setRecentSearches] = useState([]);
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	useEffect(() => {
		setRecentSearches(loadSearchHistory(authUser).slice(0, 5));
	}, [authUser]);

	const { data: users, isLoading: isLoadingUsers } = useQuery({
		queryKey: ["searchUsers", query],
		queryFn: async () => {
			if (!query) return [];
			const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		enabled: !!query,
	});

	const { data: posts, isLoading: isLoadingPosts } = useQuery({
		queryKey: ["searchPosts", query],
		queryFn: async () => {
			if (!query) return [];
			const res = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		enabled: !!query,
	});

	const userCount = users?.length || 0;
	const postCount = posts?.length || 0;
	const totalCount = userCount + postCount;

	return (
		<div className="flex-[4_4_0] min-h-screen bg-slate-50/70 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
			<div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90">
				<div className="px-4 py-4 sm:px-6">
					<div className="flex flex-col gap-4">
						<div className="space-y-1">
							<p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Tìm kiếm</p>
							<h1 className="text-2xl font-black tracking-tight sm:text-3xl">
								Tra người dùng, hashtag và bài viết
							</h1>
							<p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
								Dùng thanh tìm kiếm để lọc nội dung theo tên, @username hoặc từ khóa trong bài viết.
							</p>
						</div>

						<div className="w-full max-w-2xl">
							<AutocompleteSearch />
						</div>
					</div>
				</div>
			</div>

			<div className="px-0 sm:px-6 py-4 sm:py-6">
				{!query ? (
					<div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
						<motion.section
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.25 }}
							className="sm:rounded-3xl border-y sm:border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
						>
							<div className="flex items-center gap-2 text-slate-400">
								<Search size={16} />
								<span className="text-[11px] font-black uppercase tracking-[0.28em]">Bắt đầu tìm kiếm</span>
							</div>
							<h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
								Nhập một từ khóa để xem kết quả khớp nhất
							</h2>
							<p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
								Bạn có thể tìm theo tên người dùng, hashtag hoặc một vài từ xuất hiện trong bài viết.
							</p>

							<div className="mt-6 flex flex-wrap gap-2">
								{recentSearches.length > 0 ? (
									recentSearches.map((item) => (
										<Link
											key={item}
											to={`/search?q=${encodeURIComponent(item)}`}
											className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
										>
											<Clock size={14} />
											{item}
										</Link>
									))
								) : (
									<>
										<span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400">
											<Users size={14} />
											Người dùng
										</span>
										<span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400">
											<FileText size={14} />
											Bài viết
										</span>
										<span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400">
											# Hashtag
										</span>
									</>
								)}
							</div>
						</motion.section>

						<motion.aside
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.25, delay: 0.05 }}
							className="sm:rounded-3xl border-y sm:border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 mt-4 sm:mt-0"
						>
							<div className="flex items-center gap-2">
								<Clock size={16} className="text-indigo-500" />
								<h3 className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
									Gần đây
								</h3>
							</div>

							{recentSearches.length > 0 ? (
								<div className="mt-4 space-y-2">
									{recentSearches.map((item) => (
										<Link
											key={item}
											to={`/search?q=${encodeURIComponent(item)}`}
											className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 transition-colors hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800/60"
										>
											<span className="truncate text-sm font-medium text-slate-700 group-hover:text-indigo-600 dark:text-slate-300 dark:group-hover:text-indigo-300">
												{item}
											</span>
											<ArrowRight
												size={14}
												className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500"
											/>
										</Link>
									))}
								</div>
							) : (
								<div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
									Chưa có lịch sử tìm kiếm nào. Khi bạn bắt đầu tra cứu, truy vấn gần đây sẽ hiện ở đây để mở lại nhanh hơn.
								</div>
							)}
						</motion.aside>
					</div>
				) : (
					<>
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
							className="mb-6 flex flex-wrap items-center gap-3"
						>
							<div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
								<Search size={14} />
								{`Kết quả cho “${query}”`}
							</div>
							<div className="text-sm text-slate-500 dark:text-slate-400">
								{totalCount > 0 ? `Tìm thấy ${totalCount} mục phù hợp` : "Đang chờ dữ liệu phù hợp"}
							</div>
						</motion.div>

						<div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
							<motion.section
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.22 }}
								className="overflow-hidden sm:rounded-3xl border-y sm:border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
							>
								<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
									<div className="flex items-center gap-2">
										<Users size={16} className="text-indigo-500" />
										<h2 className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
											Người dùng
										</h2>
									</div>
									<span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
										{userCount}
									</span>
								</div>

								<div className="p-2">
									{isLoadingUsers ? (
										<div className="space-y-2 p-2">
											{[...Array(4)].map((_, idx) => (
												<div
													key={idx}
													className="flex items-center gap-3 rounded-2xl border border-slate-200/70 px-4 py-3 dark:border-slate-800"
												>
													<div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
													<div className="flex-1 space-y-2">
														<div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
														<div className="h-2.5 w-1/3 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
													</div>
												</div>
											))}
										</div>
									) : users?.length === 0 ? (
										<div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
											Không tìm thấy người dùng nào cho truy vấn này.
										</div>
									) : (
										<div className="space-y-2">
											{users?.map((user) => (
												<Link
													key={user._id}
													to={`/profile/${user.username}`}
													className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
												>
													<div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
														<img
															src={user.profileImg || "/avatar-placeholder.png"}
															alt={user.fullName}
															className="h-full w-full object-cover"
														/>
													</div>
													<div className="min-w-0 flex-1">
														<div className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-50">
															{user.fullName}
														</div>
														<div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
															@{user.username}
														</div>
													</div>
												</Link>
											))}
										</div>
									)}
								</div>
							</motion.section>

							<motion.section
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.22, delay: 0.04 }}
								className="overflow-hidden sm:rounded-3xl border-y sm:border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
							>
								<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
									<div className="flex items-center gap-2">
										<FileText size={16} className="text-indigo-500" />
										<h2 className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
											Bài viết
										</h2>
									</div>
									<span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
										{postCount}
									</span>
								</div>

								<div className="sm:p-5 p-0">
									{isLoadingPosts ? (
										<div className="space-y-4">
											<PostSkeleton />
											<PostSkeleton />
										</div>
									) : posts?.length === 0 ? (
										<div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
											Không có bài viết nào khớp với truy vấn này.
										</div>
									) : (
										<div className="space-y-4">
											{posts?.map((post) => (
												<Post key={post._id} post={post} />
											))}
										</div>
									)}
								</div>
							</motion.section>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default SearchPage;
