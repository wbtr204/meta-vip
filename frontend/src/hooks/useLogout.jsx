import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useLogout = () => {
	const queryClient = useQueryClient();

	const { mutate: logout, isPending: isLoggingOut } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch("/api/auth/logout", {
					method: "POST",
				});
				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Có lỗi xảy ra khi đăng xuất");
				}
			} catch (error) {
				throw new Error(error.message);
			}
		},
		onSuccess: () => {
			toast.success("Đã đăng xuất thành công");
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	return { logout, isLoggingOut };
};

export default useLogout;
