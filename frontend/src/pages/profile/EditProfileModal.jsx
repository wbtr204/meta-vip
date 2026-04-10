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
						initial={{ opacity: 0, y: 18, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 18, scale: 0.98 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
					>
						<div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Profile</p>
								<h3 className="mt-1 text-lg font-bold text-slate-900">Cập nhật thông tin</h3>
								<p className="mt-1 text-sm text-slate-500">Chỉnh sửa dữ liệu hiển thị công khai của bạn.</p>
							</div>

							<button
								type="button"
								onClick={onClose}
								className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
							>
								<X size={18} />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-6">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-1.5">
									<label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Tên hiển thị</label>
									<input
										type="text"
										name="fullName"
										value={formData.fullName}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Username</label>
									<input
										type="text"
										name="username"
										value={formData.username}
										onChange={handleInputChange}
										className={`${inputClass} bg-slate-50 text-slate-500`}
										disabled
									/>
								</div>
							</div>

							<div className="mt-4 space-y-1.5">
								<label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Tiểu sử</label>
								<textarea
									name="bio"
									value={formData.bio}
									onChange={handleInputChange}
									rows={4}
									className={`${inputClass} resize-none py-3`}
								/>
							</div>

							<div className="mt-4 space-y-1.5">
								<label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Khoa / ngành</label>
								<input
									type="text"
									name="department"
									value={formData.department}
									onChange={handleInputChange}
									className={inputClass}
									placeholder="Ví dụ: CNTT, Thiết kế..."
								/>
							</div>

							<div className="mt-4 space-y-1.5">
								<label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Sở thích</label>
								<input
									type="text"
									name="interests"
									value={formData.interests}
									onChange={handleInputChange}
									className={inputClass}
									placeholder="Coding, Travel, Music..."
								/>
							</div>

							<div className="mt-4 space-y-1.5">
								<label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Liên kết</label>
								<div className="relative">
									<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
										<LinkIcon className="h-4 w-4 text-slate-400" />
									</div>
									<input
										type="text"
										name="link"
										value={formData.link}
										onChange={handleInputChange}
										className={`${inputClass} pl-10`}
										placeholder="https://..."
									/>
								</div>
							</div>

							<div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
								<button
									type="button"
									onClick={onClose}
									className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
								>
									Hủy
								</button>
								<button
									type="submit"
									disabled={isUpdatingProfile}
									className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
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
