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

			<section className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm">
				<div className="group relative h-48 overflow-hidden bg-slate-200">
					<img
						src={coverImg || user?.coverImg || "/cover.png"}
						alt="Cover"
						className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
				</div>

				<div className="px-6 pb-6">
					<div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div className="relative shrink-0">
							<div className="overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
								<img src={profileImg || user?.profileImg || "/avatar-placeholder.png"} alt="Avatar" className="h-32 w-32 rounded-full object-cover" />
							</div>

							{isMyProfile && (
								<button
									type="button"
									onClick={() => profileImgRef.current?.click()}
									className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600"
									title="Đổi ảnh đại diện"
								>
									<Camera className="h-4.5 w-4.5" />
								</button>
							)}
						</div>

						<div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:pb-3">
							{isMyProfile ? (
								<>
									{(coverImg || profileImg) && (
										<button
											type="button"
											onClick={saveImages}
											disabled={isUpdatingProfile}
											className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
										>
											{isUpdatingProfile ? "Đang lưu..." : "Lưu ảnh"}
										</button>
									)}
									<button
										type="button"
										onClick={() => coverImgRef.current?.click()}
										className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
										title="Đổi ảnh bìa"
									>
										<ImagePlus className="h-4.5 w-4.5" />
									</button>
									<div ref={actionMenuRef} className="relative">
										<button
											type="button"
											onClick={() => setIsActionMenuOpen((prev) => !prev)}
											aria-expanded={isActionMenuOpen}
											aria-haspopup="menu"
											className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
											title="Tùy chọn hồ sơ"
										>
											<MoreHorizontal className="h-5 w-5" />
										</button>

										{isActionMenuOpen && (
											<motion.div
												initial={{ opacity: 0, y: -6, scale: 0.98 }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												exit={{ opacity: 0, y: -6, scale: 0.98 }}
												transition={{ duration: 0.15, ease: "easeOut" }}
												className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
											>
												<button
													type="button"
													onClick={() => {
														setIsActionMenuOpen(false);
														setIsEditProfileOpen(true);
													}}
													className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
												>
													<SquarePen className="h-4.5 w-4.5 text-indigo-500" />
													Sửa thông tin cơ bản
												</button>
											</motion.div>
										)}
									</div>
								</>
							) : (
								<>
									<button
										type="button"
										onClick={() => follow(user?._id)}
										disabled={isPending}
										className={`flex min-w-[148px] items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${
											amIFollowing
												? "border border-white/10 bg-black/40 text-white hover:bg-red-500/80"
												: isRequested
													? "border border-slate-300 bg-slate-200/50 text-slate-500"
													: "bg-indigo-600 text-white hover:bg-indigo-700"
										}`}
									>
										{isPending ? (
											"Đang xử lý..."
										) : amIFollowing ? (
											<>
												<UserMinus className="h-4 w-4" />
												Bỏ theo dõi
											</>
										) : isRequested ? (
											"Đã gửi yêu cầu"
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
										className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
										title="Nhắn tin"
									>
										<span className="inline-flex items-center gap-2">
											<MessageSquare className="h-4.5 w-4.5 text-slate-700" />
											Nhắn tin
										</span>
									</button>
									<div ref={actionMenuRef} className="relative">
										<button
											type="button"
											onClick={() => setIsActionMenuOpen((prev) => !prev)}
											aria-expanded={isActionMenuOpen}
											aria-haspopup="menu"
											className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
											title="Tùy chọn"
										>
											<MoreHorizontal className="h-5 w-5" />
										</button>

										{isActionMenuOpen && (
											<motion.div
												initial={{ opacity: 0, y: -6, scale: 0.98 }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												exit={{ opacity: 0, y: -6, scale: 0.98 }}
												transition={{ duration: 0.15, ease: "easeOut" }}
												className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
											>
												<button
													type="button"
													onClick={copyProfileLink}
													className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
												>
													<Copy className="h-4.5 w-4.5 text-indigo-500" />
													Sao chép liên kết
												</button>
											</motion.div>
										)}
									</div>
								</>
							)}
						</div>
					</div>

					<div className="mb-5">
						<h1 className="flex items-center gap-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
							{user?.fullName}
							<BadgeCheck className="h-5 w-5 text-indigo-500" />
						</h1>
						<p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
							<span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">@{user?.username}</span>
							<span className="flex items-center gap-1">
								<CalendarDays className="h-4 w-4 text-slate-400" />
								{memberSinceLabel}
							</span>
						</p>
						<p className="mt-3 max-w-lg text-[15px] leading-relaxed text-slate-700">
							{user?.bio || "Yêu nhiếp ảnh, thích đi du lịch và chia sẻ khoảnh khắc."}
						</p>
						{user?.link && (
							<a
								href={user.link}
								target="_blank"
								rel="noreferrer"
								className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
							>
								<Share2 className="h-3.5 w-3.5" />
								{user.link.replace(/^https?:\/\//, "")}
							</a>
						)}
					</div>

					<div className="grid grid-cols-1 gap-3 pb-5 text-sm sm:grid-cols-3">
						<div className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left shadow-[0_1px_0_rgba(15,23,42,0.02)]">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm ring-1 ring-slate-200/80">
								<MessageSquare className="h-4.5 w-4.5" />
							</div>
							<div className="min-w-0">
								<div className="flex items-baseline gap-2">
									<span className="text-xl font-extrabold leading-none text-slate-900">{postCount}</span>
									<span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Bài viết</span>
								</div>
								<p className="mt-1 text-xs font-medium text-slate-400">Nội dung đã đăng</p>
							</div>
						</div>

						<button
							type="button"
							disabled={isLocked}
							onClick={() => !isLocked && openModal("Người theo dõi", "followers")}
							className="group flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm ring-1 ring-slate-200/80">
								<Users className="h-4.5 w-4.5" />
							</div>
							<div className="min-w-0">
								<div className="flex items-baseline gap-2">
									<span className="text-xl font-extrabold leading-none text-slate-900">{followersCount}</span>
									<span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Người theo dõi</span>
								</div>
								<p className="mt-1 text-xs font-medium text-slate-400">Người xem hồ sơ</p>
							</div>
						</button>

						<button
							type="button"
							disabled={isLocked}
							onClick={() => !isLocked && openModal("Đang theo dõi", "following")}
							className="group flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm ring-1 ring-slate-200/80">
								<UserPlus className="h-4.5 w-4.5" />
							</div>
							<div className="min-w-0">
								<div className="flex items-baseline gap-2">
									<span className="text-xl font-extrabold leading-none text-slate-900">{followingCount}</span>
									<span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Đang theo dõi</span>
								</div>
								<p className="mt-1 text-xs font-medium text-slate-400">
									{isMyProfile ? `${friendsCount} bạn bè chung` : "Danh sách đang theo dõi"}
								</p>
							</div>
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

			<div className="mt-6 rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-sm">
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
