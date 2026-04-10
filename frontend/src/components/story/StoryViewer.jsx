import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Send } from "lucide-react";

const StoryViewer = ({ feed, onClose, onNextUser, onPrevUser }) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [progress, setProgress] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	// Use a ref to track when we need to advance, avoiding setState-in-render
	const shouldAdvanceRef = useRef(false);

	const currentStory = feed.stories[currentIndex];

	// Handle auto-advance: runs after render, safe to call state updates
	useEffect(() => {
		if (shouldAdvanceRef.current) {
			shouldAdvanceRef.current = false;
			handleNext();
		}
	});

	useEffect(() => {
		setProgress(0);
		shouldAdvanceRef.current = false;
		const interval = setInterval(() => {
			if (!isPaused) {
				setProgress((prev) => {
					if (prev >= 100) {
						shouldAdvanceRef.current = true;
						return 100;
					}
					return prev + 1;
				});
			}
		}, 60);

		return () => clearInterval(interval);
	}, [currentIndex, isPaused]);

	const handleNext = (e) => {
		if (e) e.stopPropagation();
		if (currentIndex < feed.stories.length - 1) {
			setCurrentIndex(currentIndex + 1);
		} else if (onNextUser) {
			onNextUser();
		} else {
			onClose();
		}
	};

	const handlePrev = (e) => {
		if (e) e.stopPropagation();
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		} else if (onPrevUser) {
			onPrevUser();
		}
	};

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-[100] bg-black flex items-center justify-center sm:p-4"
			>
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-50 p-2 sm:bg-slate-800/80 rounded-full"
				>
					<X size={24} />
				</button>

				{/* Story Content Card */}
				<div 
					className="relative w-full h-full sm:h-auto sm:max-w-[420px] sm:aspect-[9/16] bg-slate-900 sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col group select-none"
					onPointerDown={() => setIsPaused(true)}
					onPointerUp={() => setIsPaused(false)}
					onPointerLeave={() => setIsPaused(false)}
				>
					{/* Invisible Tap Zones for Navigation */}
					<div className="absolute inset-y-0 left-0 w-1/4 z-40" onClick={handlePrev} />
					<div className="absolute inset-y-0 right-0 w-3/4 z-40" onClick={handleNext} />
					{/* Progress Bars */}
					<div className="absolute top-4 left-4 right-4 flex gap-1 z-50">
						{feed.stories.map((_, index) => (
							<div
								key={index}
								className="flex-1 h-[2px] bg-white/20 rounded-full overflow-hidden"
							>
								<motion.div
									className="h-full bg-white"
									initial={{ width: "0%" }}
									animate={{
										width: index === currentIndex ? `${progress}%` : index < currentIndex ? "100%" : "0%",
									}}
									transition={{ duration: index === currentIndex ? 0.05 : 0.2 }}
								/>
							</div>
						))}
					</div>

					{/* Header Info */}
					<div className="absolute top-8 left-4 flex items-center gap-3 z-50">
						<img
							src={feed.user.profileImg || "/avatar-placeholder.png"}
							className="w-10 h-10 rounded-full border border-white/20 shadow-lg object-cover"
						/>
						<div className="flex flex-col">
							<span className="text-white font-bold text-sm shadow-text">{feed.user.fullName}</span>
							<span className="text-white/70 text-xs shadow-text">@{feed.user.username}</span>
						</div>
					</div>

					{/* Main Media */}
					<motion.img
						key={currentStory._id}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						src={currentStory.mediaUrl}
						className="w-full h-full object-cover"
						loading="eager"
					/>

					{/* Bottom Actions (Reply) */}
					<div className="absolute bottom-6 left-0 right-0 px-4 flex items-center gap-3 z-50">
						<div className="flex-1 bg-slate-800/50 rounded-full px-4 py-2.5 border border-white/10 focus-within:bg-slate-800/80 transition-colors">
							<input
								type="text"
								placeholder="Trả lời..."
								className="bg-transparent border-none outline-none text-white text-[15px] w-full placeholder:text-white/60"
								onFocus={() => setIsPaused(true)}
								onBlur={() => setIsPaused(false)}
							/>
						</div>
						<button className="flex items-center justify-center p-2.5 rounded-full hover:bg-white/10 transition-colors text-white hover:text-rose-500 hover:scale-110">
							<Heart size={26} strokeWidth={1.5} />
						</button>
						<button className="flex items-center justify-center p-2.5 rounded-full hover:bg-white/10 transition-colors text-white hover:scale-110">
							<Send size={24} strokeWidth={1.5} />
						</button>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default StoryViewer;
