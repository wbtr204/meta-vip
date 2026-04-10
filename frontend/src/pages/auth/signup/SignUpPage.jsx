import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

import { MdOutlineMail, MdLockOutline, MdDriveFileRenameOutline, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import BrandLogo from "../../../components/common/BrandLogo";

const signupSchema = z.object({
	email: z.string().email("Email không hợp lệ"),
	username: z.string().min(3, "Tên đăng nhập ít nhất 3 ký tự"),
	fullName: z.string().min(1, "Vui lòng nhập tên đầy đủ"),
	password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
});

const STEPS = [
	{ id: 1, label: "Thông tin cơ bản", fields: ["email", "username"] },
	{ id: 2, label: "Tên hiển thị", fields: ["fullName"] },
	{ id: 3, label: "Bảo mật", fields: ["password"] },
];

const FormField = ({ label, icon: Icon, error, children }) => (
	<div className="space-y-1.5">
		<label className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</label>
		<div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
			error
				? "border-red-500/60 bg-red-50/50"
				: "border-slate-200 bg-white focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:bg-indigo-50/30"
		}`}>
			<Icon className="absolute left-3.5 text-lg text-slate-400" />
			{children}
		</div>
		{error && (
			<p className="text-xs text-red-500 flex items-center gap-1 pl-1">
				<span>⚠</span> {error.message}
			</p>
		)}
	</div>
);

const SignUpPage = () => {
	const [step, setStep] = useState(1);
	const [showPassword, setShowPassword] = useState(false);
	const [agreed, setAgreed] = useState(false);

	const {
		register,
		handleSubmit,
		trigger,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(signupSchema),
		mode: "onChange",
	});

	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: async (data) => {
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.error || "Không thể tạo tài khoản");
			return result;
		},
		onSuccess: () => {
			toast.success("Tạo tài khoản thành công!");
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const nextStep = async () => {
		const fieldsToValidate = STEPS[step - 1].fields;
		const isValid = await trigger(fieldsToValidate);
		if (isValid) setStep((s) => s + 1);
	};

	const prevStep = () => setStep((s) => s - 1);

	const onSubmit = (data) => {
		if (!agreed) {
			toast.error("Vui lòng đồng ý với điều khoản dịch vụ");
			return;
		}
		mutate(data);
	};


	return (
		<div className="min-h-screen w-full flex bg-white">
			{/* Left — Branding Panel */}
			<motion.div
				initial={{ opacity: 0, x: -30 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
				className="hidden lg:flex flex-col justify-between w-[45%] p-14 border-r border-slate-200 bg-slate-50"
			>
				<BrandLogo size="sm" className="text-slate-900" labelClassName="text-slate-900" />

				<div className="space-y-6">
					<p className="text-[42px] font-bold text-slate-900 leading-[1.15] tracking-tight">
						Tham gia.<br />
						Khám phá.<br />
						<span className="text-indigo-600">Kết nối.</span>
					</p>
					<p className="text-slate-500 text-base leading-relaxed max-w-xs">
						Chỉ mất 1 phút để tạo tài khoản và bắt đầu hành trình của bạn trên Media Vip.
					</p>

					{/* Feature list */}
					<div className="space-y-3 pt-4">
						{["Chia sẻ khoảnh khắc cuộc sống", "Kết nối với bạn bè & cộng đồng", "Khám phá xu hướng mới nhất"].map((item) => (
							<div key={item} className="flex items-center gap-3">
								<div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
									<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
										<path d="M2 5L4.5 7.5L8.5 3" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</div>
								<span className="text-sm text-slate-500">{item}</span>
							</div>
						))}
					</div>
				</div>

				<p className="text-slate-400 text-xs">© 2025 Media Vip · DACN 2200010118</p>
			</motion.div>

			{/* Right — Form Panel */}
			<div className="flex-1 flex items-center justify-center p-6 lg:p-16">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
					className="w-full max-w-[400px]"
				>
					{/* Mobile Logo */}
					<div className="mb-10 lg:hidden">
						<BrandLogo size="sm" className="text-slate-900" labelClassName="text-slate-900" />
					</div>

					{/* Heading */}
					<div className="mb-8">
						<h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Tạo tài khoản</h1>
						<p className="text-slate-500 text-sm">Bước {step} trong {STEPS.length} — {STEPS[step - 1].label}</p>
					</div>

					{/* Step Progress */}
					<div className="flex items-center gap-2 mb-8">
						{STEPS.map((s) => (
							<div key={s.id} className="flex items-center gap-2 flex-1">
								<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 flex-shrink-0 ${
									s.id < step
										? "bg-indigo-600 text-white"
										: s.id === step
										? "bg-white border-2 border-indigo-600 text-indigo-600"
										: "bg-white border border-slate-200 text-slate-300"
								}`}>
									{s.id < step ? (
										<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
											<path d="M2 5L4.5 7.5L8.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									) : s.id}
								</div>
								{s.id < STEPS.length && (
									<div className={`flex-1 h-px transition-all duration-300 ${s.id < step ? "bg-indigo-600" : "bg-slate-100"}`} />
								)}
							</div>
						))}
					</div>

					{/* Form Fields */}
					<form onSubmit={handleSubmit(onSubmit)}>
						<AnimatePresence mode="wait">
							{/* Step 1 */}
							{step === 1 && (
								<motion.div
									key="step1"
									initial={{ opacity: 0, x: 16 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -16 }}
									transition={{ duration: 0.2 }}
									className="space-y-4"
								>
									<FormField label="Email" icon={MdOutlineMail} error={errors.email}>
										<input
											type="email"
											placeholder="ten@email.com"
											className="w-full bg-transparent pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
											{...register("email")}
										/>
									</FormField>

									<FormField label="Tên đăng nhập" icon={FaUser} error={errors.username}>
										<input
											type="text"
											placeholder="username duy nhất"
											className="w-full bg-transparent pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
											{...register("username")}
										/>
									</FormField>
								</motion.div>
							)}

							{/* Step 2 */}
							{step === 2 && (
								<motion.div
									key="step2"
									initial={{ opacity: 0, x: 16 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -16 }}
									transition={{ duration: 0.2 }}
									className="space-y-4"
								>
									<FormField label="Tên đầy đủ" icon={MdDriveFileRenameOutline} error={errors.fullName}>
										<input
											type="text"
											placeholder="Tên hiển thị của bạn"
											className="w-full bg-transparent pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
											{...register("fullName")}
										/>
									</FormField>

									<div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
										<p className="text-xs text-indigo-600 font-medium mb-1">Lưu ý</p>
										<p className="text-xs text-slate-500 leading-relaxed">
											Tên này sẽ hiển thị trên hồ sơ của bạn. Bạn có thể thay đổi sau trong phần cài đặt.
										</p>
									</div>
								</motion.div>
							)}

							{/* Step 3 */}
							{step === 3 && (
								<motion.div
									key="step3"
									initial={{ opacity: 0, x: 16 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -16 }}
									transition={{ duration: 0.2 }}
									className="space-y-4"
								>
									<div className="space-y-1.5">
										<label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mật khẩu</label>
										<div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
											errors.password
												? "border-red-500/60 bg-red-50/50"
												: "border-slate-200 bg-white focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:bg-indigo-50/30"
										}`}>
											<MdLockOutline className="absolute left-3.5 text-lg text-slate-400" />
											<input
												type={showPassword ? "text" : "password"}
												placeholder="Ít nhất 6 ký tự"
												className="w-full bg-transparent pl-10 pr-11 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
												{...register("password")}
											/>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors"
											>
												{showPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
											</button>
										</div>
										{errors.password && (
											<p className="text-xs text-red-500 flex items-center gap-1 pl-1">
												<span>⚠</span> {errors.password.message}
											</p>
										)}
									</div>

									<label className="flex items-start gap-2.5 cursor-pointer group">
										<input
											type="checkbox"
											checked={agreed}
											onChange={(e) => setAgreed(e.target.checked)}
											className="w-4 h-4 mt-0.5 rounded border border-slate-300 bg-white accent-indigo-600 cursor-pointer flex-shrink-0"
										/>
										<span className="text-xs text-slate-500 group-hover:text-slate-900 transition-colors leading-relaxed select-none">
											Tôi đồng ý với{" "}
											<Link to="#" className="text-indigo-600 hover:text-indigo-500 underline">Điều khoản dịch vụ</Link>
											{" "}và{" "}
											<Link to="#" className="text-indigo-600 hover:text-indigo-500 underline">Chính sách bảo mật</Link>
											{" "}của Media Vip.
										</span>
									</label>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Navigation Buttons */}
						<div className="flex gap-3 mt-6">
							{step > 1 && (
								<button
									type="button"
									onClick={prevStep}
									className="px-4 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-500 hover:text-slate-900 font-medium transition-all duration-200"
								>
									← Quay lại
								</button>
							)}

							{step < STEPS.length ? (
								<button
									type="button"
									onClick={nextStep}
									className="flex-1 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white text-sm font-semibold transition-all duration-200"
								>
									Tiếp theo →
								</button>
							) : (
								<button
									type="submit"
									disabled={isPending}
									className="flex-1 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
								>
									{isPending ? (
										<>
											<svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
											</svg>
											Đang tạo tài khoản...
										</>
									) : (
										"Tạo tài khoản"
									)}
								</button>
							)}
						</div>
					</form>

					{/* Divider */}
					<div className="flex items-center gap-4 my-6">
						<div className="flex-1 h-px bg-slate-200" />
						<span className="text-xs text-slate-400 font-medium">đã có tài khoản?</span>
						<div className="flex-1 h-px bg-slate-200" />
					</div>

					{/* Login link */}
					<Link to="/login">
						<button className="w-full py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-medium transition-all duration-200">
							Đăng nhập
						</button>
					</Link>
				</motion.div>
			</div>
		</div>
	);
};

export default SignUpPage;
