import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import CreatePost from "../../pages/home/CreatePost";

const CreatePostModal = ({ isOpen, onClose }) => {
	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
				{/* Backdrop */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
					className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
				/>

				{/* Modal Content */}
				<motion.div
					initial={{ opacity: 0, y: "100%" }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: "100%" }}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden flex flex-col max-h-[92vh]"
				>
					{/* Header */}
					<div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
						<div>
							<h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Tạo bài viết mới</h3>
							<p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Chia sẻ khoảnh khắc của bạn</p>
						</div>
						<button
							onClick={onClose}
							className="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
						>
							<X size={20} />
						</button>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                        {/* We use a modified version or just pass a callback to close on success */}
						<CreatePost onPostSuccess={onClose} isModal={true} />
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default CreatePostModal;
