import { useState, useRef } from "react";
import { Smile, Paperclip, Send, X, ShieldAlert } from "lucide-react";
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
		<div className="border-t border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-sm">
			{isPending && (
				<div
					className={`mb-3 flex items-center justify-between gap-3 rounded-2xl border px-4 py-2 ${
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
							className={`text-[10px] font-black uppercase tracking-wider ${
								pendingTone === "indigo"
									? "text-indigo-600 dark:text-indigo-400"
									: "text-amber-700 dark:text-amber-300"
							}`}
						>
							{isInitiator ? "Đang đợi phản hồi" : "Cần chấp nhận để trả lời"}
						</p>
					</div>
				</div>
			)}

			<AnimatePresence>
				{image && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						className="relative mb-3 h-20 w-20 overflow-hidden rounded-xl border border-slate-200 group dark:border-slate-800"
					>
						<img src={image} className="h-full w-full object-cover" alt="Upload preview" />
						<button
							onClick={() => setImage(null)}
							className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
						>
							<X size={10} />
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			<form onSubmit={handleSubmit} className="relative flex items-center gap-3">
				<div
					className={`flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition-all focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 ${
						isPending ? "opacity-60" : ""
					}`}
				>
					<div className="flex items-center">
						{!isPending && (
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="p-1.5 text-slate-400 transition-colors hover:text-indigo-500"
							>
								<Paperclip size={20} />
							</button>
						)}
						<input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageChange} />
						
						<button
							type="button"
							onClick={() => setShowEmojiPicker(!showEmojiPicker)}
							className="p-1.5 text-slate-400 transition-colors hover:text-indigo-500 disabled:opacity-40"
							disabled={isPending}
						>
							<Smile size={20} />
						</button>
					</div>

					<input
						type="text"
						placeholder={isPending ? "Chưa thể nhắn tin..." : "Nhập tin nhắn..."}
						className="flex-1 border-none bg-transparent px-2 text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-300"
						value={text}
						onChange={handleTextChange}
						onFocus={() => onTyping(true)}
						disabled={isPending}
					/>
				</div>

				<button
					type="submit"
					disabled={(!text.trim() && !image) || isPending}
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-30 disabled:shadow-none"
				>
					<Send size={18} className="rotate-0 transition-transform group-hover:rotate-12" />
				</button>

				<AnimatePresence>
					{showEmojiPicker && !isPending && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							className="absolute bottom-16 left-0 z-50 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl dark:border-slate-800"
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
