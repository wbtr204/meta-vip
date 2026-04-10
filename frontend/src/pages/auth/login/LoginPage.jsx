import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

import { MdOutlineMail, MdLockOutline, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import BrandLogo from "../../../components/common/BrandLogo";

const loginSchema = z.object({
	email: z.string().email("Vui lòng nhập định dạng email hợp lệ"),
	password: z.string().min(1, "Vui lòng nhập mật khẩu"),
	rememberMe: z.boolean().optional(),
});

const LoginPage = () => {
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: localStorage.getItem("rememberedEmail") || "",
			rememberMe: !!localStorage.getItem("rememberedEmail"),
		},
	});

	const queryClient = useQueryClient();

	const {
		mutate: loginMutation,
		isPending,
	} = useMutation({
		mutationFn: async (data) => {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: data.email, password: data.password }),
			});

			const result = await res.json();
			if (!res.ok) throw new Error(result.error || "Đăng nhập thất bại");

			if (data.rememberMe) {
				localStorage.setItem("rememberedEmail", data.email);
			} else {
				localStorage.removeItem("rememberedEmail");
			}

			return result;
		},
		onSuccess: () => {
			toast.success("Chào mừng trở lại!");
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const onSubmit = (data) => loginMutation(data);

	return (
		<div className="min-h-screen w-full flex bg-white">
			{/* Left — Branding Panel */}
			<motion.div
				initial={{ opacity: 0, x: -30 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
				className="hidden lg:flex flex-col justify-between w-[45%] p-14 border-r border-slate-200 bg-slate-50"
			>
				{/* Logo */}
				<BrandLogo size="sm" className="text-slate-900" labelClassName="text-slate-900" />

				{/* Tagline */}
				<div className="space-y-6">
					<p className="text-[42px] font-bold text-slate-900 leading-[1.15] tracking-tight">
						Kết nối.<br />
						Chia sẻ.<br />
						<span className="text-indigo-600">Tỏa sáng.</span>
					</p>
					<p className="text-slate-500 text-base leading-relaxed max-w-xs">
						Nền tảng mạng xã hội dành cho thế hệ mới - nơi ý tưởng gặp gỡ cộng đồng.
					</p>
				</div>

				{/* Bottom note */}
				<p className="text-slate-400 text-xs">
					© 2025 Media Vip · DACN 2200010118
				</p>
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
						<h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Đăng nhập</h1>
						<p className="text-slate-500 text-sm">Chào mừng trở lại. Nhập thông tin của bạn.</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{/* Email */}
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
								Email đăng ký
							</label>
							<div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
								errors.email
									? "border-red-500/60 bg-red-50/50"
									: "border-slate-200 bg-white focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:bg-indigo-50/30"
							}`}>
								<MdOutlineMail className="absolute left-3.5 text-lg text-slate-400" />
								<input
									type="email"
									placeholder="example@gmail.com"
									className="w-full bg-transparent pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
									{...register("email")}
								/>
							</div>
							{errors.email && (
								<p className="text-xs text-red-500 flex items-center gap-1 pl-1">
									<span>⚠</span> {errors.email.message}
								</p>
							)}
						</div>

						{/* Password */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
									Mật khẩu
								</label>
								<Link to="#" className="text-xs text-indigo-600 hover:text-indigo-500 transition-colors">
									Quên mật khẩu?
								</Link>
							</div>
							<div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
								errors.password
									? "border-red-500/60 bg-red-50/50"
									: "border-slate-200 bg-white focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:bg-indigo-50/30"
							}`}>
								<MdLockOutline className="absolute left-3.5 text-lg text-slate-400" />
								<input
									type={showPassword ? "text" : "password"}
									placeholder="••••••••"
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

						{/* Remember me */}
						<label className="flex items-center gap-2.5 cursor-pointer group pt-1">
							<input
								type="checkbox"
								className="w-4 h-4 rounded border border-slate-300 bg-white accent-indigo-600 cursor-pointer"
								{...register("rememberMe")}
							/>
							<span className="text-sm text-slate-500 group-hover:text-slate-900 transition-colors select-none">
								Ghi nhớ đăng nhập
							</span>
						</label>

						{/* Submit */}
						<div className="pt-2">
							<button
								type="submit"
								disabled={isPending}
								className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{isPending ? (
									<>
										<svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
										</svg>
										Đang xử lý...
									</>
								) : (
									"Đăng nhập"
								)}
							</button>
						</div>
					</form>

					{/* Divider */}
					<div className="flex items-center gap-4 my-6">
						<div className="flex-1 h-px bg-slate-200" />
						<span className="text-xs text-slate-400 font-medium">chưa có tài khoản?</span>
						<div className="flex-1 h-px bg-slate-200" />
					</div>

					{/* Sign up link */}
					<Link to="/signup">
						<button className="w-full py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-medium transition-all duration-200">
							Tạo tài khoản mới
						</button>
					</Link>
				</motion.div>
			</div>
		</div>
	);
};

export default LoginPage;
