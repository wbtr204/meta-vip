import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowRight,
	Clock,
	Hash,
	MessageSquare,
	Search,
	User as UserIcon,
	X,
} from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";
import { loadSearchHistory, saveSearchHistory } from "../../utils/searchHistory";

const AutocompleteSearch = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [searchHistory, setSearchHistory] = useState([]);
	const debouncedSearchTerm = useDebounce(searchTerm, 300);
	const dropdownRef = useRef(null);
	const navigate = useNavigate();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	useEffect(() => {
		setSearchHistory(loadSearchHistory(authUser));
	}, [authUser]);

	const saveHistory = (newHistory) => {
		setSearchHistory(newHistory);
		saveSearchHistory(authUser, newHistory);
	};

	const addToHistory = (term) => {
		const normalized = term.trim();
		if (!normalized) return;

		const deduped = searchHistory.filter((item) => item.toLowerCase() !== normalized.toLowerCase());
		saveHistory([normalized, ...deduped].slice(0, 8));
	};

	const removeFromHistory = (term) => {
		saveHistory(searchHistory.filter((item) => item !== term));
	};

	const clearAllHistory = () => saveHistory([]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const { data: searchResults, isLoading, isError } = useQuery({
		queryKey: ["autocompleteSearch", debouncedSearchTerm],
		queryFn: async () => {
			if (debouncedSearchTerm.trim().length === 0) {
				return { users: [], posts: [], hashtags: [] };
			}

			const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(debouncedSearchTerm)}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");
			return data;
		},
		enabled: debouncedSearchTerm.trim().length > 0,
	});

	const query = searchTerm.trim();
	const hasResults =
		searchResults &&
		(searchResults.users?.length > 0 || searchResults.posts?.length > 0 || searchResults.hashtags?.length > 0);

	const resultCount =
		(searchResults?.users?.length || 0) + (searchResults?.hashtags?.length || 0) + (searchResults?.posts?.length || 0);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!query) return;

		addToHistory(query);
		setIsDropdownOpen(false);
		navigate(`/search?q=${encodeURIComponent(query)}`);
	};

	const handleSelectResult = () => {
		if (query) addToHistory(query);
		setIsDropdownOpen(false);
	};

	return (
		<div className="relative w-full" ref={dropdownRef}>
			<form onSubmit={handleSubmit} className="relative w-full z-20">
				<input
					type="text"
					className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-11 pr-11 text-[14px] text-slate-900 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-indigo-500/40 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
					placeholder="Tìm kiếm người, bài viết, hashtag..."
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						setIsDropdownOpen(true);
					}}
					onClick={() => setIsDropdownOpen(true)}
					onFocus={() => setIsDropdownOpen(true)}
					onKeyDown={(e) => {
						if (e.key === "Escape") setIsDropdownOpen(false);
					}}
					aria-expanded={isDropdownOpen}
					aria-label="Tìm kiếm"
				/>
				<Search
					className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500 dark:text-slate-500"
					size={18}
				/>

				{searchTerm && (
					<button
						type="button"
						onClick={() => {
							setSearchTerm("");
							setIsDropdownOpen(true);
						}}
						className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
						aria-label="Xóa nội dung"
					>
						<X size={14} />
					</button>
				)}
			</form>

			<AnimatePresence>
				{isDropdownOpen && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.985 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.985 }}
						transition={{ duration: 0.16, ease: "easeOut" }}
						className="absolute z-50 mt-2 flex max-h-[520px] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
					>
						<div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-2">
									<div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
										<Search size={16} />
									</div>
									<div>
										<p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
											{query ? "Kết quả tức thì" : "Tìm kiếm gần đây"}
										</p>
										<p className="text-xs text-slate-500 dark:text-slate-400">
											{query ? `Khớp nhanh cho "${query}"` : "Chọn lại một truy vấn trước đó hoặc nhập từ khóa mới."}
										</p>
									</div>
								</div>

								{query && (
									<span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
										{resultCount} mục
									</span>
								)}
							</div>
						</div>

						<div className="flex-1 overflow-y-auto custom-scrollbar">
							{!query && searchHistory.length > 0 && (
								<div className="py-2">
									<div className="flex items-center justify-between px-4 py-2">
										<div className="flex items-center gap-2">
											<Clock size={14} className="text-slate-400" />
											<span className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
												Truy vấn gần đây
											</span>
										</div>
										<button
											type="button"
											onClick={clearAllHistory}
											className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500 transition-colors hover:text-rose-600"
										>
											Xóa
										</button>
									</div>

									<div className="px-2">
										{searchHistory.map((item) => (
											<div
												key={item}
												className="group flex w-full items-center justify-between rounded-2xl px-1 py-1 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
											>
												<button
													type="button"
													onClick={() => {
														setSearchTerm(item);
														navigate(`/search?q=${encodeURIComponent(item)}`);
														setIsDropdownOpen(false);
													}}
													className="flex flex-1 items-center gap-3 px-2 py-2 text-left"
												>
													<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-500 dark:bg-slate-800">
														<Clock size={14} />
													</div>
													<span className="text-sm font-medium text-slate-700 transition-colors group-hover:text-slate-950 dark:text-slate-300 dark:group-hover:text-white">
														{item}
													</span>
												</button>

												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														removeFromHistory(item);
													}}
													className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-rose-500/10"
													title="Xóa khỏi lịch sử"
												>
													<X size={14} />
												</button>
											</div>
										))}
									</div>
								</div>
							)}

							{!query && searchHistory.length === 0 && (
								<div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
										<Search size={22} />
									</div>
									<div className="space-y-1">
										<p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bắt đầu tìm kiếm</p>
										<p className="text-sm text-slate-400 dark:text-slate-500">
											Nhập tên người dùng, hashtag hoặc một vài từ trong bài viết.
										</p>
									</div>
								</div>
							)}

							{query && (
								<>
									{isLoading && (
										<div className="flex items-center justify-center px-6 py-10">
											<div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-500" />
										</div>
									)}

									{isError && (
										<div className="px-6 py-8 text-center text-sm font-semibold text-rose-500">
											Không thể tải kết quả tìm kiếm.
										</div>
									)}

									{!isLoading && !isError && !hasResults && (
										<div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
											<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
												<X size={22} />
											</div>
											<div className="space-y-1">
												<p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
													Không có kết quả cho “{query}”
												</p>
												<p className="text-sm text-slate-400 dark:text-slate-500">
													Thử đổi sang từ khóa ngắn hơn, tên người dùng, hoặc hashtag.
												</p>
											</div>
										</div>
									)}

									{!isLoading && hasResults && (
										<div className="py-2">
											{searchResults?.users?.length > 0 && (
												<section className="pb-2">
													<div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
														<div className="flex items-center gap-2">
															<UserIcon size={14} className="text-indigo-500" />
															<span className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
																Người dùng
															</span>
														</div>
														<span className="text-[11px] font-semibold text-slate-400">
															{searchResults.users.length}
														</span>
													</div>
													<div className="px-2 py-1">
														{searchResults.users.map((user) => (
															<Link
																key={`user-${user._id}`}
																to={`/profile/${user.username}`}
																onClick={handleSelectResult}
																className="group flex items-center justify-between rounded-2xl px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
															>
																<div className="flex min-w-0 items-center gap-3">
																	<div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
																		<img
																			src={user.profileImg || "/avatar-placeholder.png"}
																			alt={user.fullName}
																			className="h-full w-full object-cover"
																		/>
																	</div>
																	<div className="min-w-0">
																		<p className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-50">
																			{user.fullName}
																		</p>
																		<p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
																			@{user.username}
																		</p>
																	</div>
																</div>
																<ArrowRight
																	size={14}
																	className="text-slate-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 dark:text-slate-600"
																/>
															</Link>
														))}
													</div>
												</section>
											)}

											{searchResults?.hashtags?.length > 0 && (
												<section className="pb-2">
													<div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
														<div className="flex items-center gap-2">
															<Hash size={14} className="text-indigo-500" />
															<span className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
																Hashtag
															</span>
														</div>
														<span className="text-[11px] font-semibold text-slate-400">
															{searchResults.hashtags.length}
														</span>
													</div>
													<div className="px-2 py-1">
														{searchResults.hashtags.map((tag) => (
															<Link
																key={`tag-${tag._id}`}
																to={`/search?q=${encodeURIComponent(tag.text)}`}
																onClick={handleSelectResult}
																className="group flex items-center justify-between rounded-2xl px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
															>
																<div className="flex min-w-0 items-center gap-3">
																	<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-500 dark:bg-slate-800">
																		<Hash size={16} />
																	</div>
																	<div className="min-w-0">
																		<p className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-50">
																			{tag.text}
																		</p>
																		<p className="text-[11px] text-slate-500 dark:text-slate-400">
																			{tag.count} bài viết
																		</p>
																	</div>
																</div>
																<ArrowRight
																	size={14}
																	className="text-slate-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 dark:text-slate-600"
																/>
															</Link>
														))}
													</div>
												</section>
											)}

											{searchResults?.posts?.length > 0 && (
												<section>
													<div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
														<div className="flex items-center gap-2">
															<MessageSquare size={14} className="text-indigo-500" />
															<span className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
																Bài viết
															</span>
														</div>
														<span className="text-[11px] font-semibold text-slate-400">
															{searchResults.posts.length}
														</span>
													</div>
													<div className="px-2 py-1">
														{searchResults.posts.map((post) => (
															<Link
																key={`post-${post._id}`}
																to={`/post/${post._id}`}
																onClick={handleSelectResult}
																className="group flex flex-col gap-2 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
															>
																<div className="flex items-center gap-2">
																	<div className="h-6 w-6 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
																		<img
																			src={post.user.profileImg || "/avatar-placeholder.png"}
																			alt={post.user.username}
																			className="h-full w-full object-cover"
																		/>
																	</div>
																	<span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
																		{post.user.fullName}
																	</span>
																</div>

																<div className="flex gap-3">
																	{(post.img || post.imgs?.length > 0) && (
																		<div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
																			<img
																				src={post.img || post.imgs[0]}
																				className="h-full w-full object-cover"
																				alt="Post preview"
																			/>
																		</div>
																	)}
																	<p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
																		{post.text}
																	</p>
																</div>
															</Link>
														))}
													</div>
												</section>
											)}
										</div>
									)}

									{!isLoading && hasResults && (
										<button
											type="button"
											onClick={handleSubmit}
											className="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-4 py-4 text-[11px] font-black uppercase tracking-[0.28em] text-indigo-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
										>
											Xem tất cả kết quả
											<ArrowRight size={14} />
										</button>
									)}
								</>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default AutocompleteSearch;
