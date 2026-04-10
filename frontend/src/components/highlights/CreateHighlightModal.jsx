import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Image, X } from "lucide-react";

const storyKey = (story) => story?.sourceStoryId || story?._id;

const CreateHighlightModal = ({
	isOpen,
	mode = "create",
	stories = [],
	initialHighlight = null,
	onClose,
	onSubmit,
}) => {
	const initialStoryIds = useMemo(() => {
		if (!initialHighlight?.stories?.length) return [];
		return initialHighlight.stories
			.map((story) => story.sourceStoryId || story._id)
			.filter(Boolean)
			.map(String);
	}, [initialHighlight]);

	const [step, setStep] = useState(1);
	const [title, setTitle] = useState("");
	const [selectedStoryIds, setSelectedStoryIds] = useState([]);
	const [coverStoryId, setCoverStoryId] = useState(null);
	const [isCompactViewport, setIsCompactViewport] = useState(false);

	const activeStories = initialHighlight?.stories?.length ? initialHighlight.stories : stories;

	const activeStoryMap = useMemo(() => {
		return new Map(activeStories.map((story) => [String(storyKey(story)), story]));
	}, [activeStories]);

	const selectedStories = selectedStoryIds
		.map((id) => activeStoryMap.get(String(id)))
		.filter(Boolean);

	const currentCoverStory = activeStoryMap.get(String(coverStoryId)) || selectedStories[0];

	useEffect(() => {
		if (!isOpen) return;

		setStep(1);
		setTitle(initialHighlight?.title || "");
		setSelectedStoryIds(initialStoryIds);
		setCoverStoryId(initialHighlight?.coverStoryId ? String(initialHighlight.coverStoryId) : initialStoryIds[0] || null);
	}, [isOpen, initialHighlight, initialStoryIds]);

	useEffect(() => {
		if (coverStoryId && !selectedStoryIds.includes(String(coverStoryId))) {
			setCoverStoryId(selectedStoryIds[0] || null);
		}
	}, [coverStoryId, selectedStoryIds]);

	useEffect(() => {
		if (typeof window === "undefined") return undefined;

		const updateViewportMode = () => {
			setIsCompactViewport(window.innerWidth < 1280 || window.innerHeight < 860);
		};

		updateViewportMode();
		window.addEventListener("resize", updateViewportMode);
		return () => window.removeEventListener("resize", updateViewportMode);
	}, []);

	const toggleStory = (id) => {
		const stringId = String(id);
		setSelectedStoryIds((prev) => {
			const exists = prev.includes(stringId);
			const next = exists ? prev.filter((item) => item !== stringId) : [...prev, stringId];

			if (!exists && !coverStoryId) {
				setCoverStoryId(stringId);
			}

			if (exists && String(coverStoryId) === stringId) {
				setCoverStoryId(next[0] || null);
			}

			return next;
		});
	};

	const submitPayload = () => {
		onSubmit?.({
			title: title.trim().slice(0, 15),
			storyIds: selectedStoryIds,
			coverStoryId,
			coverImage: currentCoverStory?.mediaUrl,
		});
	};

	const handlePrimaryAction = () => {
		if (step === 1) {
			if (!selectedStoryIds.length || !activeStories.length) return;
			setStep(2);
			return;
		}

		submitPayload();
	};

	const handleFormSubmit = (e) => {
		e.preventDefault();
		if (step === 2) submitPayload();
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4">
					<motion.button
						aria-label="Close create highlight modal"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
					/>

					<motion.div
						initial={{ opacity: 0, y: 18, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 18, scale: 0.98 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						style={{
							width: "min(calc(100vw - 1rem), 72rem)",
							maxHeight: "calc(100dvh - 1rem)",
						}}
						className="relative z-10 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
					>
						<div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-6">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
									{mode === "edit" ? "Chỉnh sửa" : "Tạo mới"}
								</p>
								<h3 className="mt-1 text-lg font-bold text-slate-900">
									{mode === "edit" ? "Chỉnh sửa nổi bật" : "Tạo tin nổi bật"}
								</h3>
								<p className="mt-1 text-sm text-slate-500">
									{step === 1
										? "Chọn các tin từ kho lưu trữ để ghim thành một bộ."
										: "Đặt tên và chọn ảnh bìa cho bộ tin nổi bật."}
								</p>
							</div>

							<button
								type="button"
								onClick={onClose}
								className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
							>
								<X size={18} />
							</button>
						</div>

						<form onSubmit={handleFormSubmit} className="flex min-h-0 flex-1 flex-col">
							<div className="min-h-0 flex-1 overflow-y-auto">
								<div className="grid min-h-0 grid-cols-1 gap-0">
									<div className="border-b border-slate-100 p-4 sm:p-5">
										{step === 1 ? (
											<div className="space-y-4">
												<div className="flex items-center justify-between gap-3">
													<div>
														<h4 className="text-sm font-bold text-slate-900">Kho lưu trữ tin</h4>
														<p className="text-xs text-slate-500">Chọn ít nhất 1 tin để tạo bộ nổi bật.</p>
													</div>
													<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
														{selectedStoryIds.length} đã chọn
													</span>
												</div>

												{activeStories.length === 0 ? (
													<div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center sm:min-h-[220px]">
														<Image className="mb-3 h-10 w-10 text-slate-300" />
														<p className="text-sm font-semibold text-slate-600">Chưa có tin nào trong kho lưu trữ.</p>
														<p className="mt-1 text-xs text-slate-400">
															Hãy đăng story trước, rồi quay lại tạo Tin nổi bật.
														</p>
													</div>
												) : (
													<div
														className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3"
														style={{ maxHeight: isCompactViewport ? "280px" : "380px" }}
													>
														{activeStories.map((story) => {
															const id = String(storyKey(story));
															const selected = selectedStoryIds.includes(id);

															return (
																<button
																	key={id}
																	type="button"
																	onClick={() => toggleStory(id)}
																	className={`group relative aspect-square overflow-hidden rounded-2xl border transition-all ${
																		selected
																			? "border-indigo-500 ring-2 ring-indigo-500/20"
																			: "border-slate-200 hover:border-indigo-300"
																	}`}
																>
																	{story.mediaType === "video" ? (
																		<video src={story.mediaUrl} className="h-full w-full object-cover" muted />
																	) : (
																		<img src={story.mediaUrl} alt="" className="h-full w-full object-cover" />
																	)}
																	<div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
																	<div
																		className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
																			selected
																				? "border-indigo-500 bg-indigo-500 text-white"
																				: "border-white/50 bg-black/20 text-white opacity-0 group-hover:opacity-100"
																		}`}
																	>
																		<Check size={14} />
																	</div>
																	<div className="absolute bottom-2 left-2 right-2 text-left">
																		<p className="truncate text-[11px] font-semibold text-white/90">
																			{new Date(story.createdAt || Date.now()).toLocaleDateString("vi-VN")}
																		</p>
																	</div>
																</button>
															);
														})}
													</div>
												)}
											</div>
										) : (
											<div className="space-y-4">
												<div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
													<button
														type="button"
														onClick={() => setStep(1)}
														className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
													>
														<ChevronLeft size={14} />
														Quay lại chọn tin
													</button>
												</div>

												<div className="space-y-2">
													<label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
														Tiêu đề
													</label>
													<input
														value={title}
														onChange={(e) => setTitle(e.target.value)}
														maxLength={15}
														placeholder="Ví dụ: Travel 2026"
														className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
													/>
													<p className="text-right text-xs text-slate-400">{title.length}/15</p>
												</div>

												<div className="space-y-2">
													<label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
														Ảnh bìa
													</label>
													<div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
														<div className={`relative bg-slate-200 ${isCompactViewport ? "aspect-[9/12] max-h-[260px]" : "aspect-[4/5]"}`}>
															{currentCoverStory?.mediaType === "video" ? (
																<video
																	src={currentCoverStory?.mediaUrl}
																	className="h-full w-full object-cover"
																	muted
																	playsInline
																/>
															) : currentCoverStory ? (
																<img
																	src={currentCoverStory.mediaUrl}
																	alt="Cover preview"
																	className="h-full w-full object-cover"
																/>
															) : (
																<div className="flex h-full items-center justify-center text-slate-300">
																	<Image size={48} />
																</div>
															)}
															<div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
														</div>
													</div>

													<div className="grid grid-cols-4 gap-2">
														{selectedStories.map((story) => {
															const id = String(storyKey(story));
															const active = String(coverStoryId) === id;

															return (
																<button
																	key={id}
																	type="button"
																	onClick={() => setCoverStoryId(id)}
																	className={`aspect-square overflow-hidden rounded-2xl border transition-all ${
																		active
																			? "border-indigo-500 ring-2 ring-indigo-500/20"
																			: "border-slate-200 hover:border-indigo-300"
																	}`}
																>
																	{story.mediaType === "video" ? (
																		<video src={story.mediaUrl} className="h-full w-full object-cover" muted />
																	) : (
																		<img src={story.mediaUrl} alt="" className="h-full w-full object-cover" />
																	)}
																</button>
															);
														})}
													</div>

													<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
														<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Preview</p>
														<div className="mt-3 overflow-hidden rounded-2xl bg-slate-100">
															<div className="relative aspect-[9/16] max-h-[220px]">
																{currentCoverStory?.mediaType === "video" ? (
																	<video
																		src={currentCoverStory?.mediaUrl}
																		className="h-full w-full object-cover"
																		muted
																		playsInline
																	/>
																) : currentCoverStory ? (
																	<img
																		src={currentCoverStory.mediaUrl}
																		alt="Preview"
																		className="h-full w-full object-cover"
																	/>
																) : (
																	<div className="flex h-full items-center justify-center text-slate-300">
																		<Image size={32} />
																	</div>
																)}
																<div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
																<div className="absolute bottom-0 left-0 right-0 p-3 text-white">
																	<div className="truncate text-sm font-bold">{title || "Untitled"}</div>
																	<div className="text-[11px] text-white/70">
																		{selectedStoryIds.length} story{selectedStoryIds.length > 1 ? "s" : ""}
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							<div className="shrink-0 border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
								<div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
									<button
										type="button"
										onClick={onClose}
										className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
									>
										Hủy
									</button>
									<button
										type={step === 1 ? "button" : "submit"}
										onClick={step === 1 ? handlePrimaryAction : undefined}
										disabled={step === 1 && (!selectedStoryIds.length || !activeStories.length)}
										className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{step === 1 ? "Tiếp tục" : mode === "edit" ? "Lưu thay đổi" : "Tạo nổi bật"}
										<ChevronRight size={16} />
									</button>
								</div>
							</div>
						</form>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default CreateHighlightModal;
