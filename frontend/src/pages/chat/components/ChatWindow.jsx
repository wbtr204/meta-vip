import { useEffect, useRef } from "react";
import { Phone, Video, Info, ChevronLeft, Check, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const ChatWindow = ({
	selectedConversation,
	messages,
	isLoading,
	onSend,
	onBack,
	onConversationUpdate,
	authUser,
	isTyping,
	onTyping,
}) => {
	const scrollRef = useRef(null);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages, isTyping]);

	const { mutate: acceptRequest, isPending: isAccepting } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/messages/accept/${selectedConversation.user._id}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Lỗi khi chấp nhận yêu cầu");
			return data;
		},
		onSuccess: () => {
            onConversationUpdate?.((current) =>
                current
                    ? {
                            ...current,
                            status: "accepted",
                      }
                    : current
            );
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
			toast.success("Đã chấp nhận yêu cầu!");
		},
		onError: (err) => toast.error(err.message),
	});

	const { mutate: rejectRequest, isPending: isRejecting } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/messages/reject/${selectedConversation.user._id}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Lỗi khi từ chối yêu cầu");
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
			onBack();
			toast.success("Đã xóa yêu cầu.");
		},
		onError: (err) => toast.error(err.message),
	});

	if (!selectedConversation) {
		return (
			<div className="hidden flex-1 flex-col items-center justify-center bg-white p-10 text-center dark:bg-slate-950 md:flex">
				<div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-900">
					<span className="material-symbols-outlined text-[48px]">chat_bubble</span>
				</div>
				<h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
					Tin nhắn của bạn
				</h3>
				<p className="max-w-xs text-sm text-slate-500">
					Chọn một cuộc trò chuyện để bắt đầu.
				</p>
			</div>
		);
	}

	const selectedInitiatorId = selectedConversation.initiatorId?.toString?.() || selectedConversation.initiatorId;
	const currentUserId = authUser?._id?.toString?.() || authUser?._id;
	const isPending = selectedConversation.status === "pending";
	const isInitiator = selectedInitiatorId === currentUserId;
	const showRequestBanner = isPending && !isInitiator;

	return (
		<div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">
			<div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
				<div className="flex items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-3">
						<button
							onClick={onBack}
							className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
						>
							<ChevronLeft size={22} />
						</button>

						<div className="relative shrink-0">
							<div className="h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
								<img
									src={selectedConversation.user.profileImg || "/avatar-placeholder.png"}
									className="h-full w-full object-cover"
									alt={selectedConversation.user.fullName}
								/>
							</div>
							{!isPending && (
								<div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
							)}
						</div>

						<div className="min-w-0">
							<div className="truncate text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
								{selectedConversation.user.fullName}
							</div>
							<div className="flex items-center gap-2">
								<span className={`h-1.5 w-1.5 rounded-full ${isPending ? "bg-slate-400" : "bg-emerald-500"}`} />
								<p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
									{isPending ? "Tin nhắn chờ" : "Đang hoạt động"} · @{selectedConversation.user.username}
								</p>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-1">
						{!isPending && (
							<>
								<button className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-500 dark:hover:bg-slate-800">
									<Phone size={18} />
								</button>
								<button className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-500 dark:hover:bg-slate-800">
									<Video size={18} />
								</button>
							</>
						)}
						<button className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
							<Info size={18} />
						</button>
					</div>
				</div>
			</div>

			<div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-slate-50/40 dark:bg-slate-950/30">
				<div className="px-4 py-4 sm:px-6">
					{isLoading ? (
						<div className="flex justify-center py-10">
							<LoadingSpinner size="md" />
						</div>
					) : (
						<>
							{messages?.length === 0 && (
								<div className="mb-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
									<div className="flex items-center gap-3">
										<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
											<span className="material-symbols-outlined text-[22px]">person</span>
										</div>
										<div className="min-w-0">
											<div className="truncate text-sm font-bold text-slate-900 dark:text-white">
												{selectedConversation.user.fullName}
											</div>
											<div className="truncate text-xs text-slate-500 dark:text-slate-400">
												@{selectedConversation.user.username}
											</div>
										</div>
									</div>
									<p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
										Bắt đầu cuộc trò chuyện bằng một tin nhắn ngắn gọn.
									</p>
								</div>
							)}

							{showRequestBanner && (
								<div className="mb-4 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
									<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
										<div className="flex items-start gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
												<ShieldAlert size={18} />
											</div>
											<div className="min-w-0">
												<p className="text-sm font-bold text-amber-800 dark:text-amber-200">
													{selectedConversation.user.fullName} đã gửi yêu cầu nhắn tin
												</p>
												<p className="mt-1 text-sm text-amber-700/80 dark:text-amber-300/80">
													Chấp nhận để mở khóa trả lời và hiển thị đầy đủ nội dung.
												</p>
											</div>
										</div>

										<div className="flex items-center gap-2">
												<button
													onClick={() => acceptRequest()}
													disabled={isAccepting || isRejecting}
													className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-50 dark:bg-white dark:text-slate-900"
												>
												{isAccepting ? <LoadingSpinner size="xs" /> : <><Check size={16} /> Chấp nhận</>}
											</button>
											<button
												onClick={() => rejectRequest()}
												disabled={isAccepting || isRejecting}
												className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
											>
												{isRejecting ? <LoadingSpinner size="xs" /> : <><X size={16} /> Xóa</>}
											</button>
										</div>
									</div>
								</div>
							)}

							{messages?.map((msg) => (
								<MessageBubble
									key={msg._id}
									message={msg}
									isOwnMessage={msg.senderId === authUser._id}
									otherUser={selectedConversation.user}
								/>
							))}

							<AnimatePresence>
								{isTyping && (
									<motion.div
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -10 }}
										className="mb-4 ml-10 flex items-center gap-2"
									>
										<div className="flex gap-1 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-900">
											<div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
											<div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
											<div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
										</div>
									</motion.div>
								)}
							</AnimatePresence>

							{isPending && isInitiator && (
								<div className="mt-4 rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-4">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
											<ShieldAlert size={18} />
										</div>
										<div className="min-w-0">
											<p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
												Yêu cầu nhắn tin đã được gửi
											</p>
											<p className="text-sm text-indigo-600/80 dark:text-indigo-400/80">
												Bạn chỉ có thể nhắn tiếp sau khi đối phương chấp nhận.
											</p>
										</div>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			<ChatInput
				onSend={onSend}
				onTyping={onTyping}
				isPending={isPending}
				isInitiator={isInitiator}
			/>
		</div>
	);
};

export default ChatWindow;
