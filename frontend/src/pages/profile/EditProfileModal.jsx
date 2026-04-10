import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link as LinkIcon, X } from "lucide-react";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";

const inputClass =
	"w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";

const EditProfileModal = ({ authUser, isOpen, onClose }) => {
	const [formData, setFormData] = useState({
		fullName: "",
		username: "",
		bio: "",
		link: "",
		department: "",
		interests: "",
	});

	const { updateProfile, isUpdatingProfile } = useUpdateUserProfile();

	useEffect(() => {
		if (!authUser) return;

		setFormData({
			fullName: authUser.fullName || "",
			username: authUser.username || "",
			bio: authUser.bio || "",
			link: authUser.link || "",
			department: authUser.department || "",
			interests: authUser.interests?.join(", ") || "",
		});
	}, [authUser]);

	const handleInputChange = (e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		const updatedData = {
			...formData,
			interests: formData.interests
				.split(",")
				.map((item) => item.trim())
				.filter(Boolean),
		};

		await updateProfile(updatedData);
		onClose?.();
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
					<motion.button
						aria-label="Close edit profile modal"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
					/>

					<motion.div
						initial={{ opacity: 0, y: "100%" }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: "100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-[2rem] sm:rounded-3xl border border-slate-200 bg-white shadow-2xl mt-auto sm:mt-0"
					>
						{/* Mobile Handle */}
						<div className="flex justify-center py-3 sm:hidden">
							<div className="w-12 h-1.5 bg-slate-200 rounded-full" />
						</div>

						<div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-5 sm:py-4">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-500">Người dùng</p>
								<h3 className="mt-1 text-xl font-black text-slate-900 tracking-tight">Cập nhật hồ sơ</h3>
								<p className="mt-1 text-xs font-medium text-slate-500">Thay đổi thông tin hiển thị của bạn</p>
							</div>

							<button
								type="button"
								onClick={onClose}
								className="rounded-2xl p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="max-h-[80vh] sm:max-h-[75vh] overflow-y-auto px-6 py-8 no-scrollbar">
							<div className="grid gap-5 sm:grid-cols-2">
								<div className="space-y-2">
									<label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên hiển thị</label>
									<input
										type="text"
										name="fullName"
										value={formData.fullName}
										onChange={handleInputChange}
										className={inputClass}
										placeholder="Họ và tên của bạn"
									/>
								</div>
								<div className="space-y-2">
									<label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
									<input
										type="text"
										name="username"
										value={formData.username}
										onChange={handleInputChange}
										className={`${inputClass} bg-slate-50 text-slate-400 cursor-not-allowed`}
										disabled
									/>
								</div>
							</div>

							<div className="mt-6 space-y-2">
								<label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tiểu sử (Bio)</label>
								<textarea
									name="bio"
									value={formData.bio}
									onChange={handleInputChange}
									rows={3}
									className={`${inputClass} resize-none py-4 leading-relaxed`}
									placeholder="Kể chút về bản thân bạn..."
								/>
							</div>

							<div className="mt-6 space-y-2">
								<label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Khoa / Ngành học</label>
								<input
									type="text"
									name="department"
									value={formData.department}
									onChange={handleInputChange}
									className={inputClass}
									placeholder="Ví dụ: Công nghệ thông tin"
								/>
							</div>

							<div className="mt-6 space-y-2">
								<label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Liên kết cá nhân</label>
								<div className="relative group">
									<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 transition-colors group-focus-within:text-indigo-500">
										<LinkIcon className="h-4 w-4" />
									</div>
									<input
										type="text"
										name="link"
										value={formData.link}
										onChange={handleInputChange}
										className={`${inputClass} pl-11`}
										placeholder="https://facebook.com/your-id"
									/>
								</div>
							</div>

							<div className="mt-10 mb-2 flex flex-col sm:flex-row gap-3">
								<button
									type="submit"
									disabled={isUpdatingProfile}
									className="order-1 sm:order-2 flex-1 rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isUpdatingProfile ? "Đang lưu..." : "Cập nhật ngay"}
								</button>
								<button
									type="button"
									onClick={onClose}
									className="order-2 sm:order-1 flex-1 rounded-2xl bg-slate-100 py-4 text-sm font-black text-slate-600 transition-colors hover:bg-slate-200"
								>
									Hủy bỏ
								</button>
							</div>
						</form>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default EditProfileModal;
