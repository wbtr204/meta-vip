import { useState, useRef } from "react";
import { Smile, Image, Send, X, ShieldAlert } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";

const ChatInput = ({ onSend, onTyping, isPending, isInitiator }) => {
	const [text, setText] = useState("");
	const [image, setImage] = useState(null);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const fileInputRef = useRef(null);
	const typingTimeoutRef = useRef(null);

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => setImage(reader.result);
			reader.readAsDataURL(file);
		}
	};

	const handleEmojiClick = (emojiData) => {
		setText((prev) => prev + emojiData.emoji);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!text.trim() && !image) return;
		onSend({ message: text, image });
		setText("");
		setImage(null);
		setShowEmojiPicker(false);
	};

	const handleTextChange = (e) => {
		setText(e.target.value);

		onTyping(true);
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => {
			onTyping(false);
		}, 2000);
	};

	const pendingTone = isInitiator ? "indigo" : "amber";

	return (
		<div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
			{isPending && (
				<div
					className={`mb-4 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
						pendingTone === "indigo"
							? "border-indigo-500/20 bg-indigo-500/10"
							: "border-amber-500/20 bg-amber-500/10"
					}`}
				>
					<div className="flex items-center gap-2">
						<ShieldAlert
							size={14}
							className={pendingTone === "indigo" ? "text-indigo-500" : "text-amber-500"}
						/>
						<p
							className={`text-[11px] font-black uppercase tracking-[0.24em] ${
								pendingTone === "indigo"
									? "text-indigo-600 dark:text-indigo-400"
									: "text-amber-700 dark:text-amber-300"
							}`}
						>
							{isInitiator ? "Đang đợi phản hồi" : "Cần chấp nhận để trả lời"}
						</p>
					</div>
					<span
						className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
							pendingTone === "indigo" ? "text-indigo-500/80" : "text-amber-600/80"
						}`}
					>
						{isInitiator ? "Tin nhắn đang chờ duyệt" : "Yêu cầu nhắn tin"}
					</span>
				</div>
			)}

			<AnimatePresence>
				{image && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						className="relative mb-4 h-24 w-24 overflow-hidden rounded-xl border border-slate-200 group dark:border-slate-800"
					>
						<img src={image} className="h-full w-full object-cover" alt="Upload preview" />
						<button
							onClick={() => setImage(null)}
							className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
						>
							<X size={12} />
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			<form onSubmit={handleSubmit} className="relative flex items-center gap-2">
				<div
					className={`flex flex-1 items-center rounded-[2rem] border border-transparent bg-slate-100 px-4 py-2 ring-1 ring-transparent transition-all focus-within:border-slate-200 focus-within:ring-indigo-500/30 dark:bg-slate-900 dark:focus-within:border-slate-700 ${
						isPending ? "opacity-60" : ""
					}`}
				>
					<button
						type="button"
						onClick={() => setShowEmojiPicker(!showEmojiPicker)}
						className="p-1.5 text-slate-500 transition-colors hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
						disabled={isPending}
					>
						<Smile size={20} />
					</button>

					<input
						type="text"
						placeholder={isPending ? "Chưa thể nhắn tin..." : "Nhắn tin..."}
						className="flex-1 border-none bg-transparent px-3 text-[15px] font-medium text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-300"
						value={text}
						onChange={handleTextChange}
						onFocus={() => onTyping(true)}
						disabled={isPending}
					/>

					{!isPending && (
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="p-1.5 text-slate-500 transition-colors hover:text-indigo-500"
						>
							<Image size={20} />
						</button>
					)}
					<input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageChange} />
				</div>

				<button
					type="submit"
					disabled={(!text.trim() && !image) || isPending}
					className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-all hover:scale-105 active:scale-90 disabled:scale-95 disabled:opacity-30 dark:bg-white dark:text-slate-900"
				>
					<Send size={18} fill="currentColor" />
				</button>

				<AnimatePresence>
					{showEmojiPicker && !isPending && (
						<motion.div
							initial={{ opacity: 0, scale: 0.98 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.98 }}
							transition={{ duration: 0.15, ease: "easeOut" }}
							className="absolute bottom-16 left-0 z-50 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-indigo-500/10 dark:border-slate-800"
						>
							<EmojiPicker theme="auto" onEmojiClick={handleEmojiClick} width={300} height={400} />
						</motion.div>
					)}
				</AnimatePresence>
			</form>
		</div>
	);
};

export default ChatInput;
