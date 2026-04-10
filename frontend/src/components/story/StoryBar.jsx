import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import LoadingSpinner from "../common/LoadingSpinner";
import StoryViewer from "./StoryViewer";

const StoryBar = () => {
	const queryClient = useQueryClient();
	const imgRef = useRef(null);
	const [selectedStoryUser, setSelectedStoryUser] = useState(null);

	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const { data: storyFeeds, isLoading } = useQuery({
		queryKey: ["stories"],
		queryFn: async () => {
			try {
				const res = await fetch("/api/stories/feed");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Something went wrong");
				return data; // Array of { user, stories }
			} catch (error) {
				throw new Error(error);
			}
		},
	});

	const { mutate: createStory, isPending: isCreating } = useMutation({
		mutationFn: async (mediaUrl) => {
			try {
				const res = await fetch("/api/stories/create", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ mediaUrl }),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Something went wrong");
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			toast.success("Story đã được đăng!");
			queryClient.invalidateQueries({ queryKey: ["stories"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleImgChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				createStory(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleNextUser = () => {
		if (!selectedStoryUser || !storyFeeds) return;
		const currentIndex = storyFeeds.findIndex(f => f.user._id === selectedStoryUser.user._id);
		if (currentIndex < storyFeeds.length - 1) {
			setSelectedStoryUser(storyFeeds[currentIndex + 1]);
		} else {
			setSelectedStoryUser(null);
		}
	};

	const handlePrevUser = () => {
		if (!selectedStoryUser || !storyFeeds) return;
		const currentIndex = storyFeeds.findIndex(f => f.user._id === selectedStoryUser.user._id);
		if (currentIndex > 0) {
			setSelectedStoryUser(storyFeeds[currentIndex - 1]);
		}
	};

	if (isLoading) return <LoadingSpinner />;

	return (
		<div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide py-2 px-4 sm:px-0">
			{/* Create Story Button */}
			<div className="flex flex-col items-center gap-1 min-w-[70px]">
				<div
					className="relative w-16 h-16 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors group"
					onClick={() => imgRef.current.click()}
				>
					{isCreating ? (
						<LoadingSpinner size="sm" />
					) : (
						<>
							<img
								src={authUser?.profileImg || "/avatar-placeholder.png"}
								className="w-14 h-14 rounded-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
							/>
							<div className="absolute bottom-0 right-0 bg-indigo-500 rounded-full p-0.5 border-2 border-white dark:border-slate-950 text-white">
								<Plus size={14} strokeWidth={3} />
							</div>
						</>
					)}
					<input type="file" hidden ref={imgRef} onChange={handleImgChange} accept="image/*" />
				</div>
				<span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Bạn</span>
			</div>

			{/* Story Feeds */}
			{storyFeeds?.map((feed) => (
				<div
					key={feed.user._id}
					className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer"
					onClick={() => setSelectedStoryUser(feed)}
				>
					<div className="relative p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
						<div className="p-[2px] bg-white dark:bg-slate-950 rounded-full">
							<img
								src={feed.user.profileImg || "/avatar-placeholder.png"}
								className="w-14 h-14 rounded-full object-cover"
							/>
						</div>
					</div>
					<span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate w-16 text-center">
						{feed.user.username === authUser?.username ? "Story của bạn" : feed.user.username}
					</span>
				</div>
			))}

			{selectedStoryUser && (
				<StoryViewer
					feed={selectedStoryUser}
					onClose={() => setSelectedStoryUser(null)}
					onNextUser={handleNextUser}
					onPrevUser={handlePrevUser}
				/>
			)}
		</div>
	);
};

export default StoryBar;
