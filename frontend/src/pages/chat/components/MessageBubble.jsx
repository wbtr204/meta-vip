import { motion } from "framer-motion";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

const MessageBubble = ({ message, isOwnMessage, otherUser }) => {
    const time = format(new Date(message.createdAt), 'HH:mm');

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex flex-col mb-4 ${isOwnMessage ? "items-end" : "items-start"}`}
        >
            <div className={`flex gap-2 max-w-[75%] md:max-w-[60%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar for other user */}
                {!isOwnMessage && (
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-auto border border-slate-200 dark:border-slate-800 shadow-sm">
                        <img src={otherUser?.profileImg || "/avatar-placeholder.png"} className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    {/* Media content */}
                    {message.image && (
                        <div className={`rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl mb-1 max-w-sm ${isOwnMessage ? "ml-auto" : "mr-auto"}`}>
                            <img src={message.image} className="w-full h-auto object-cover max-h-80" alt="Chat content" />
                        </div>
                    )}

                    {/* Text content */}
                    {message.message && (
                        <div 
                            className={`px-4 py-2.5 rounded-2xl shadow-sm text-[14px] font-medium leading-relaxed
                                ${isOwnMessage 
                                    ? "bg-indigo-600 text-white rounded-tr-none" 
                                    : "bg-slate-100 dark:bg-slate-900 dark:text-slate-200 text-slate-800 rounded-tl-none border border-slate-200/50 dark:border-slate-800/50"
                                }`}
                        >
                            {message.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer with time & status */}
            <div className={`flex items-center gap-1.5 mt-1 px-1 ${isOwnMessage ? "mr-1" : "ml-10"}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{time}</span>
                {isOwnMessage && (
                    <span className="text-indigo-500">
                        {message.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

export default MessageBubble;
