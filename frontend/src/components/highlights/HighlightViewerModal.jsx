import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";

const storyKey = (story) => story?.sourceStoryId || story?._id;

const HighlightViewerModal = ({
	isOpen,
	highlight,
	isOwnProfile = false,
	onClose,
	onEdit,
	onDelete,
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [progress, setProgress] = useState(0);
	const [showMenu, setShowMenu] = useState(false);
	const timerRef = useRef(null);

	const stories = highlight?.stories || [];
	const currentStory = stories[currentIndex];

	useEffect(() => {
		if (!isOpen) return;
		setCurrentIndex(0);
		setProgress(0);
		setShowMenu(false);
	}, [isOpen, highlight?._id]);

	useEffect(() => {
		if (!isOpen || !currentStory) return undefined;

		setProgress(0);
		clearInterval(timerRef.current);

		timerRef.current = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					clearInterval(timerRef.current);
					if (currentIndex < stories.length - 1) {
						setCurrentIndex((idx) => idx + 1);
					} else {
						onClose?.();
					}
					return 100;
				}
				return prev + 2;
			});
		}, 100);

		return () => clearInterval(timerRef.current);
	}, [isOpen, currentIndex, currentStory, stories.length, onClose]);

	const goNext = () => {
		if (currentIndex < stories.length - 1) {
			setCurrentIndex((idx) => idx + 1);
		} else {
			onClose?.();
		}
	};

	const goPrev = () => {
		if (currentIndex > 0) {
			setCurrentIndex((idx) => idx - 1);
		}
	};

	const coverInfo = useMemo(() => {
		if (!highlight) return null;
		return {
			title: highlight.title,
			coverImage: highlight.coverImage,
			user: highlight.userId,
		};
	}, [highlight]);

	if (!highlight) return null;

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90">
					<motion.button
						aria-label="Close highlight viewer"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0"
					/>

					<div className="relative z-10 h-full w-full overflow-hidden bg-black md:h-[calc(100svh-2rem)] md:max-h-[960px] md:w-[420px] md:rounded-[2rem]">
						<div className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 px-4 pb-4 pt-4">
							<img
								src={coverInfo?.coverImage || coverInfo?.user?.profileImg || "/avatar-placeholder.png"}
								alt=""
								className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20"
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-semibold text-white">{coverInfo?.title}</p>
								<p className="truncate text-xs text-white/65">
									@{coverInfo?.user?.username || ""}
								</p>
							</div>

							{isOwnProfile && (
								<div className="relative">
									<button
										type="button"
										onClick={() => setShowMenu((prev) => !prev)}
										className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
									>
										<MoreHorizontal size={18} />
									</button>

									<AnimatePresence>
										{showMenu && (
											<motion.div
												initial={{ opacity: 0, y: -6, scale: 0.98 }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												exit={{ opacity: 0, y: -6, scale: 0.98 }}
												className="absolute right-0 top-11 w-44 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
											>
												<button
													type="button"
													onClick={() => {
														setShowMenu(false);
														onEdit?.(highlight);
													}}
													className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
												>
													<Pencil size={16} />
													Chỉnh sửa
												</button>
												<button
													type="button"
													onClick={() => {
														setShowMenu(false);
														onDelete?.(highlight);
													}}
													className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
												>
													<Trash2 size={16} />
													Xóa
												</button>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							)}

							<button
								type="button"
								onClick={onClose}
								className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
							>
								<X size={20} />
							</button>
						</div>

						<div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-4 pt-3">
							{stories.map((story, index) => (
								<div key={storyKey(story) || index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
									<div
										className="h-full rounded-full bg-white transition-all duration-100"
										style={{
											width:
												index < currentIndex
													? "100%"
													: index === currentIndex
														? `${progress}%`
														: "0%",
										}}
									/>
								</div>
							))}
						</div>

						<button
							type="button"
							onClick={goPrev}
							className="absolute inset-y-0 left-0 z-10 w-1/2"
							aria-label="Previous story"
						/>
						<button
							type="button"
							onClick={goNext}
							className="absolute inset-y-0 right-0 z-10 w-1/2"
							aria-label="Next story"
						/>

						<div className="absolute inset-0">
							{currentStory?.mediaType === "video" ? (
								<video
									key={storyKey(currentStory)}
									src={currentStory.mediaUrl}
									className="h-full w-full object-cover"
									autoPlay
									muted
									playsInline
								/>
							) : (
								<img
									key={storyKey(currentStory)}
									src={currentStory?.mediaUrl}
									alt=""
									className="h-full w-full object-cover"
								/>
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
						</div>

						<div className="absolute bottom-0 left-0 right-0 z-20 p-4">
							<div className="rounded-3xl border border-white/10 bg-black/35 p-4 text-white backdrop-blur-md">
								<p className="text-xs uppercase tracking-[0.24em] text-white/55">
									Tin {currentIndex + 1} / {stories.length}
								</p>
								<p className="mt-1 text-base font-semibold">{highlight.title}</p>
								<p className="mt-1 text-sm text-white/70">
									{new Date(currentStory?.createdAt || Date.now()).toLocaleString("vi-VN", {
										day: "2-digit",
										month: "2-digit",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						</div>

						<div className="absolute inset-x-4 bottom-24 z-20 flex items-center justify-between">
							<button
								type="button"
								onClick={goPrev}
								className="rounded-full border border-white/10 bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20"
							>
								<ChevronLeft size={18} />
							</button>
							<button
								type="button"
								onClick={goNext}
								className="rounded-full border border-white/10 bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20"
							>
								<ChevronRight size={18} />
							</button>
						</div>
					</div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default HighlightViewerModal;
