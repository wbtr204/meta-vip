import { motion } from "framer-motion";
import { Repeat, Quote, Link2, Send } from "lucide-react";
import toast from "react-hot-toast";

const ShareMenu = ({ onRepost, onQuote, postUrl, onClose }) => {
    const copyToClipboard = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(postUrl);
        toast.success("Đã sao chép liên kết!");
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-12 left-0 min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
        >
            <div className="p-1.5 flex flex-col gap-0.5">
                <button
                    onClick={(e) => { e.stopPropagation(); onRepost(); onClose(); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left rounded-xl group"
                >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                        <Repeat size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Đăng lại ngay</span>
                        <span className="text-[10px] text-slate-500">Gửi trực tiếp lên tường nhà bạn</span>
                    </div>
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onQuote(); onClose(); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left rounded-xl group"
                >
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                        <Quote size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Trích dẫn (Quote)</span>
                        <span className="text-[10px] text-slate-500">Cùng với suy nghĩ của bạn</span>
                    </div>
                </button>

                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

                <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left rounded-xl group"
                >
                    <div className="p-2 rounded-lg bg-slate-500/10 text-slate-500 group-hover:scale-110 transition-transform">
                        <Link2 size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Sao chép liên kết</span>
                </button>

                <button
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left rounded-xl group"
                >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                        <Send size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Gửi qua tin nhắn</span>
                </button>
            </div>
        </motion.div>
    );
};

export default ShareMenu;
