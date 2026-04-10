import { useRef, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import { 
    Image as ImageIcon, 
    Video, 
    Smile, 
    MapPin, 
    Globe, 
    ChevronDown, 
    X,
    SendHorizonal,
    MapPinned
} from "lucide-react";

const CreatePost = () => {
	const [text, setText] = useState("");
	const [imgs, setImgs] = useState([]);
    const [location, setLocation] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [privacy] = useState("public");
    
	const imgRef = useRef(null);
    const textareaRef = useRef(null);
    const emojiPickerRef = useRef(null);

	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const queryClient = useQueryClient();

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [text]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

	const {
		mutate: createPost,
		isPending,
		isError,
		error,
	} = useMutation({
		mutationFn: async ({ text, imgs, location }) => {
			const res = await fetch("/api/posts/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text, imgs, location }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Đăng bài thất bại");
			return data;
		},
		onSuccess: (data) => {
			setText("");
			setImgs([]);
            setLocation("");
            setIsFocused(false);
            setShowLocationInput(false);
            setShowEmojiPicker(false);
			if (data?.moderation?.status === "flagged") {
				toast("Bài viết đã được đăng nhưng đang chờ kiểm duyệt");
			} else {
				toast.success("Đã đăng bài viết thành công!");
			}
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		createPost({ text, imgs, location });
	};

	const handleImgChange = (e) => {
		const files = Array.from(e.target.files);
		if (files.length + imgs.length > 4) {
			toast.error("Tối đa 4 ảnh cho mỗi bài đăng");
			return;
		}
		files.forEach((file) => {
			const reader = new FileReader();
			reader.onload = () => setImgs((prev) => [...prev, reader.result]);
			reader.readAsDataURL(file);
		});
	};

    const onEmojiClick = (emojiData) => {
        const cursor = textareaRef.current.selectionStart;
        const textBefore = text.substring(0, cursor);
        const textAfter = text.substring(cursor);
        const newText = textBefore + emojiData.emoji + textAfter;
        setText(newText);
        
        // Return focus to textarea and place cursor after emoji
        setTimeout(() => {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = cursor + emojiData.emoji.length;
            textareaRef.current.focus();
        }, 10);
    };

	return (
		<section className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 transition-all shadow-sm">
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="flex gap-4">
					<div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
						<img
							src={authUser?.profileImg || "/avatar-placeholder.png"}
							className="w-full h-full object-cover"
							alt="avatar"
                            loading="lazy"
						/>
					</div>
					
					<div className="flex-1 flex flex-col gap-2 pt-2">
                        {/* Privacy Selector Snippet */}
                        {isFocused && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center"
                            >
                                <button type="button" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider">
                                    <Globe size={10} />
                                    <span>{privacy === "public" ? "Công khai" : "Chỉ mình tôi"}</span>
                                    <ChevronDown size={10} />
                                </button>
                            </motion.div>
                        )}

						<textarea
                            ref={textareaRef}
							className="w-full bg-transparent border-none outline-none focus:ring-0 text-[15px] leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none min-h-[40px] max-h-[400px] transition-all"
							placeholder={`Bạn đang nghĩ gì, ${authUser?.fullName?.split(' ')[0] ?? 'bạn'}?`}
							value={text}
							onChange={(e) => setText(e.target.value)}
                            onFocus={() => setIsFocused(true)}
						/>

                        {/* Trending Suggestions */}
                        {isFocused && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-wrap gap-2 mb-2"
                            >
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-center mr-1">Gợi ý:</span>
                                {["#ReactJS", "#AI", "#KhoaLuan", "#CNTT", "#SocialMedia"].map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => {
                                            if (!text.includes(tag)) {
                                                setText(prev => prev.trim() + " " + tag + " ");
                                            }
                                        }}
                                        className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-500 hover:text-white transition-all border border-slate-200 dark:border-slate-700 font-medium"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {/* Location Badge */}
                        <AnimatePresence>
                            {location && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold"
                                >
                                    <MapPinned size={12} />
                                    <span>tại {location}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setLocation("")}
                                        className="p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-full transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Location Input Field */}
                        <AnimatePresence>
                            {showLocationInput && !location && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="relative mb-2"
                                >
                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Bạn đang ở đâu?"
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        autoFocus
                                        onBlur={() => !location && setShowLocationInput(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), setShowLocationInput(false))}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
					</div>
				</div>

				{/* Image Grid Preview */}
				{imgs.length > 0 && (
					<div className={`grid gap-2 mb-2 rounded-xl overflow-hidden ${
                        imgs.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    }`}>
						{imgs.map((img, index) => (
							<div key={index} className={`relative group ${
                                imgs.length === 3 && index === 0 ? "row-span-2 h-full" : "h-48"
                            }`}>
								<img src={img} className="w-full h-full object-cover" alt="preview" loading="lazy" />
								<button
									type="button"
									onClick={() => setImgs((prev) => prev.filter((_, i) => i !== index))}
									className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 rounded-full text-white transition-all scale-90 group-hover:scale-100"
								>
									<X size={16} />
								</button>
							</div>
						))}
					</div>
				)}

				<div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/50">
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => imgRef.current.click()}
							className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 group"
                            title="Thêm ảnh"
						>
							<ImageIcon size={18} className="group-hover:text-indigo-500 transition-colors" />
						</button>
                        
                        <button type="button" className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 group" title="Thêm Video">
                            <Video size={18} className="group-hover:text-indigo-500 transition-colors" />
                        </button>
                        
                        <div className="relative" ref={emojiPickerRef}>
                            <button 
                                type="button" 
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group ${showEmojiPicker ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "text-slate-500 dark:text-slate-400"}`} 
                                title="Cảm xúc"
                            >
                                <Smile size={18} className="group-hover:text-indigo-500 transition-colors" />
                            </button>
                            
                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 z-50 mb-2 shadow-2xl">
                                    <EmojiPicker 
                                        onEmojiClick={onEmojiClick}
                                        autoFocusSearch={false}
                                        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                                        width={320}
                                        height={400}
                                        lazyLoadEmojis={true}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

                        <button 
                            type="button" 
                            onClick={() => setShowLocationInput(!showLocationInput)}
                            className={`p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group hidden sm:flex ${showLocationInput ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "text-slate-500 dark:text-slate-400"}`} 
                            title="Check-in"
                        >
                            <MapPin size={18} className="group-hover:text-indigo-500 transition-colors" />
                        </button>

						<input type="file" accept="image/*" multiple hidden ref={imgRef} onChange={handleImgChange} />
					</div>

					<button
						type="submit"
						disabled={isPending || (!text.trim() && imgs.length === 0)}
						className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-95"
					>
						{isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Đăng bài</span>
                                <SendHorizonal size={14} />
                            </>
                        )}
					</button>
				</div>
				{isError && <p className="text-[11px] text-red-500 font-medium px-1 ">{error.message}</p>}
			</form>
		</section>
	);
};

export default CreatePost;
