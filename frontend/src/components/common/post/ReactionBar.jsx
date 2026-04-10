import { motion } from "framer-motion";

const REACTIONS = [
    { type: "like", label: "Thích", emoji: "👍" },
    { type: "love", label: "Yêu thích", emoji: "❤️" },
    { type: "haha", label: "Haha", emoji: "😂" },
    { type: "wow", label: "Wow", emoji: "😮" },
    { type: "sad", label: "Buồn", emoji: "😢" },
    { type: "angry", label: "Phẫn nộ", emoji: "😡" },
];

const ReactionBar = ({ onSelect }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute -top-14 left-0 flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-xl shadow-indigo-500/10 z-[100]"
        >
            {REACTIONS.map((reac, i) => (
                <motion.button
                    key={reac.type}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.3, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(reac.type);
                    }}
                    className="text-2xl w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative group"
                    title={reac.label}
                >
                    {reac.emoji}
                    <span className="absolute -top-8 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {reac.label}
                    </span>
                </motion.button>
            ))}
        </motion.div>
    );
};

export default ReactionBar;
