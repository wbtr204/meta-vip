import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
	BadgeCheck,
	CalendarDays,
	Camera,
	ChevronRight,
	Copy,
	Heart,
	ImagePlus,
	Lock,
	MessageSquare,
	MoreHorizontal,
	Share2,
	SquarePen,
	Users,
	UserMinus,
	UserPlus,
} from "lucide-react";

import Posts from "../../components/common/Posts";
import HighlightsList from "../../components/highlights/HighlightsList";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import UserListModal from "../../components/common/UserListModal";
import EditProfileModal from "./EditProfileModal";
import useFollow from "../../hooks/useFollow";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";

const formatJoinedLabel = (createdAt) => {
	if (!createdAt) return "";
	const date = new Date(createdAt);
	const month = new Intl.DateTimeFormat("vi-VN", { month: "long" }).format(date);
	return `Tham gia ${month.charAt(0).toUpperCase() + month.slice(1)}, ${date.getFullYear()}`;
};

const ProfilePage = () => {
	const [coverImg, setCoverImg] = useState(null);
	const [profileImg, setProfileImg] = useState(null);
	const [feedType, setFeedType] = useState("posts");
	const [postCount, setPostCount] = useState(0);
	const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", endpoint: "" });
	const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
	const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

	const coverImgRef = useRef(null);
	const profileImgRef = useRef(null);
	const actionMenuRef = useRef(null);
	const { username } = useParams();
	const navigate = useNavigate();

	const { follow, isPending } = useFollow();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const { isUpdatingProfile, updateProfile } = useUpdateUserProfile();

	const {
		data: user,
		isLoading,
		refetch,
		isRefetching,
	} = useQuery({
		queryKey: ["userProfile", username],
		queryFn: async () => {
			const res = await fetch(`/api/users/profile/${username}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
	});

	useEffect(() => {
		refetch();
	}, [username, refetch]);

	useEffect(() => {
		const handlePointerDown = (event) => {
			if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
				setIsActionMenuOpen(false);
			}
		};

		const handleEscape = (event) => {
			if (event.key === "Escape") {
				setIsActionMenuOpen(false);
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleEscape);
		};
	}, []);

	const isMyProfile = authUser?._id === user?._id;
	const amIFollowing = authUser?.following?.includes(user?._id);
	const isRequested = user?.followRequests?.includes(authUser?._id);
	const isLocked = !isMyProfile && user?.isPrivate && !amIFollowing;
	const memberSinceLabel = formatJoinedLabel(user?.createdAt);
	const followersCount = user?.followers?.length || 0;
	const followingCount = user?.following?.length || 0;
	const friendsCount = user?.friendsCount || 0;

	const handleImgChange = (e, target) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			if (target === "coverImg") setCoverImg(reader.result);
			if (target === "profileImg") setProfileImg(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const saveImages = async () => {
		await updateProfile({ coverImg, profileImg });
		setCoverImg(null);
		setProfileImg(null);
	};

	const copyProfileLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			toast.success("Đã sao chép liên kết hồ sơ");
		} catch {
			toast.error("Không thể sao chép liên kết");
		}
		setIsActionMenuOpen(false);
	};

	const openModal = (title, endpoint) => {
		setModalConfig({ isOpen: true, title, endpoint });
	};

	if (isLoading || isRefetching) return <ProfileHeaderSkeleton />;

	if (!user) {
		return (
			<div className="flex h-screen items-center justify-center">
				<p className="text-lg font-semibold text-slate-500">Người dùng không tồn tại</p>
			</div>
		);
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-w-0 max-w-4xl pb-20">
			<input type="file" hidden ref={coverImgRef} accept="image/*" onChange={(e) => handleImgChange(e, "coverImg")} />
			<input type="file" hidden ref={profileImgRef} accept="image/*" onChange={(e) => handleImgChange(e, "profileImg")} />

			<section className="overflow-hidden sm:rounded-[1.25rem] sm:border border-slate-200/80 bg-white sm:shadow-sm">
				<div className="group relative h-40 sm:h-52 overflow-hidden bg-slate-200">
					<img
						src={coverImg || user?.coverImg || "/cover.png"}
						alt="Cover"
						className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
				</div>

				<div className="px-4 sm:px-6 pb-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div className="relative shrink-0 w-fit -mt-12 sm:-mt-16">
							<div className="overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
								<img src={profileImg || user?.profileImg || "/avatar-placeholder.png"} alt="Avatar" className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover" />
							</div>

							{isMyProfile && (
								<button
									type="button"
									onClick={() => profileImgRef.current?.click()}
									className="absolute bottom-1 right-1 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600"
									title="Đổi ảnh đại diện"
								>
									<Camera className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
								</button>
							)}
						</div>

						<div className="flex flex-1 items-center gap-2 sm:gap-3 sm:pb-3 w-full sm:w-auto">
							{isMyProfile ? (
								<div className="flex flex-1 items-center gap-2">
									{(coverImg || profileImg) && (
										<button
											type="button"
											onClick={saveImages}
											disabled={isUpdatingProfile}
											className="flex-1 sm:flex-none rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
										>
											{isUpdatingProfile ? "Lưu..." : "Lưu ảnh"}
										</button>
									)}
									<button
										type="button"
										onClick={() => setIsEditProfileOpen(true)}
										className="flex-1 sm:flex-none flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
									>
										<SquarePen className="h-4.5 w-4.5 text-indigo-500" />
										<span className="hidden sm:inline">Chỉnh sửa</span>
										<span className="sm:hidden">Sửa</span>
									</button>
									<button
										type="button"
										onClick={() => coverImgRef.current?.click()}
										className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
										title="Đổi ảnh bìa"
									>
										<ImagePlus className="h-4.5 w-4.5" />
									</button>
								</div>
							) : (
								<div className="flex flex-1 items-center gap-2">
									<button
										type="button"
										onClick={() => follow(user?._id)}
										disabled={isPending}
										className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-bold shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${
											amIFollowing
												? "bg-slate-100 text-slate-900 hover:bg-red-50 hover:text-red-600 shadow-none border border-slate-200"
												: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20"
										}`}
									>
										{isPending ? (
											"..."
										) : amIFollowing ? (
											<>
												<UserMinus className="h-4 w-4" />
												Hủy
											</>
										) : (
											<>
												<UserPlus className="h-4 w-4" />
												Theo dõi
											</>
										)}
									</button>
									<button
										type="button"
										onClick={() => navigate(`/chat?user=${user?.username}`)}
										className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
									>
										<MessageSquare className="h-4.5 w-4.5 text-slate-700" />
										Nhắn tin
									</button>
									<div ref={actionMenuRef} className="relative">
										<button
											type="button"
											onClick={() => setIsActionMenuOpen((prev) => !prev)}
											className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
										>
											<MoreHorizontal className="h-5 w-5" />
										</button>
										{isActionMenuOpen && (
											<motion.div
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl z-10"
											>
												<button
													type="button"
													onClick={copyProfileLink}
													className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
												>
													<Copy className="h-4 w-4" />
													Sao chép link
												</button>
											</motion.div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="mb-6">
						<div className="flex items-center justify-between">
							<h1 className="flex items-center gap-1.5 text-2xl font-black tracking-tight text-slate-900">
								{user?.fullName}
								<BadgeCheck className="h-5 w-5 text-indigo-500" />
							</h1>
						</div>
						<div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
							<span className="font-bold text-indigo-600">@{user?.username}</span>
							<span className="flex items-center gap-1.5 text-slate-500">
								<CalendarDays className="h-4 w-4 text-slate-400" />
								{memberSinceLabel}
							</span>
						</div>
						<p className="mt-3.5 text-[15px] leading-relaxed text-slate-600">
							{user?.bio || "Một người dùng ẩn danh quyến rũ."}
						</p>
						{user?.link && (
							<div className="mt-4 flex">
								<a
									href={user.link}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-[13px] font-bold text-slate-700 transition-all hover:bg-indigo-50 hover:text-indigo-600 ring-1 ring-slate-100"
								>
									<Share2 className="h-3.5 w-3.5" />
									{user.link.replace(/^https?:\/\//, "")}
								</a>
							</div>
						)}
					</div>

					<div className="flex items-center justify-around border-y border-slate-100 py-4 mb-2">
						<div className="flex flex-col items-center">
							<span className="text-lg font-black text-slate-900">{postCount}</span>
							<span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Bài viết</span>
						</div>
						<button
							onClick={() => !isLocked && openModal("Người theo dõi", "followers")}
							className="flex flex-col items-center transition-opacity active:opacity-60"
						>
							<span className="text-lg font-black text-slate-900">{followersCount}</span>
							<span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Followers</span>
						</button>
						<button
							onClick={() => !isLocked && openModal("Đang theo dõi", "following")}
							className="flex flex-col items-center transition-opacity active:opacity-60"
						>
							<span className="text-lg font-black text-slate-900">{followingCount}</span>
							<span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Following</span>
						</button>
					</div>
				</div>

				<HighlightsList username={username} userId={user?._id} isOwnProfile={isMyProfile} />

				<div className="px-6 pb-6">
					<div className="flex rounded-xl bg-slate-100/80 p-1.5">
						<button
							type="button"
							onClick={() => setFeedType("posts")}
							className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${
								feedType === "posts"
									? "border border-slate-200/50 bg-white text-slate-900 shadow-sm"
									: "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
							}`}
						>
							<MessageSquare className="h-4 w-4 text-indigo-500" />
							Bài viết
						</button>
						<button
							type="button"
							onClick={() => setFeedType("likes")}
							className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${
								feedType === "likes"
									? "border border-slate-200/50 bg-white text-slate-900 shadow-sm"
									: "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
							}`}
						>
							<Heart className="h-4 w-4" />
							Yêu thích
						</button>
					</div>
				</div>
			</section>

			<div className="mt-2 sm:mt-6 sm:rounded-[1.25rem] sm:border border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 sm:p-5 p-0 sm:shadow-sm">
				<div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
					<ChevronRight className="h-3.5 w-3.5 text-indigo-500" />
					{isMyProfile ? "Bài đăng của bạn" : `${user?.fullName} đã đăng`}
				</div>

				{isLocked ? (
					<div className="flex flex-col items-center justify-center rounded-[32px] border border-slate-200/50 bg-slate-50 px-6 py-20 text-center">
						<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
							<Lock className="h-8 w-8" />
						</div>
						<h3 className="mb-2 text-xl font-extrabold tracking-tight text-slate-900">Tài khoản này là riêng tư</h3>
						<p className="max-w-xs text-sm font-medium leading-relaxed text-slate-500">
							Hãy theo dõi để xem ảnh, video và bài viết của họ.
						</p>
					</div>
				) : (
					<>
						<Posts feedType={feedType} username={username} userId={user?._id} onDataLoad={setPostCount} />
						<div className="mt-8 text-center">
							<span className="inline-block rounded-full bg-slate-200/50 px-4 py-2 text-xs font-medium text-slate-500">
								Bạn đã xem hết bài viết
							</span>
						</div>
					</>
				)}
			</div>

			<EditProfileModal authUser={authUser} isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />

			<UserListModal
				isOpen={modalConfig.isOpen}
				onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
				title={modalConfig.title}
				endpoint={modalConfig.endpoint}
				userId={user?._id}
				allowActions={isMyProfile}
				showFriendsSection={isMyProfile && modalConfig.endpoint === "following"}
			/>
		</motion.div>
	);
};

export default ProfilePage;
