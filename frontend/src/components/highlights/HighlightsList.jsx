import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import CreateHighlightModal from "./CreateHighlightModal";
import HighlightViewerModal from "./HighlightViewerModal";

const HighlightsList = ({ username, userId, isOwnProfile }) => {
	const queryClient = useQueryClient();
	const [viewerHighlight, setViewerHighlight] = useState(null);
	const [editingHighlight, setEditingHighlight] = useState(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const { data: highlights = [], isLoading } = useQuery({
		queryKey: ["profileHighlights", username],
		queryFn: async () => {
			const res = await fetch(`/api/highlights/user/${username}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Không thể tải tin nổi bật");
			return data;
		},
		enabled: !!username,
	});

	const {
		data: archivedStories = [],
		isLoading: isArchivedStoriesLoading,
	} = useQuery({
		queryKey: ["archivedStories", userId],
		queryFn: async () => {
			const res = await fetch("/api/stories/archive");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Không thể tải kho lưu trữ tin");
			return data;
		},
		enabled: !!isOwnProfile,
	});

	const createMutation = useMutation({
		mutationFn: async (payload) => {
			const res = await fetch("/api/highlights", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Tạo tin nổi bật thất bại");
			return data;
		},
		onSuccess: () => {
			toast.success("Đã tạo tin nổi bật");
			queryClient.invalidateQueries({ queryKey: ["profileHighlights", username] });
			setIsCreateOpen(false);
		},
		onError: (error) => toast.error(error.message),
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, ...payload }) => {
			const res = await fetch(`/api/highlights/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Cập nhật tin nổi bật thất bại");
			return data;
		},
		onSuccess: () => {
			toast.success("Đã cập nhật tin nổi bật");
			queryClient.invalidateQueries({ queryKey: ["profileHighlights", username] });
			setEditingHighlight(null);
		},
		onError: (error) => toast.error(error.message),
	});

	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const res = await fetch(`/api/highlights/${id}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Xóa tin nổi bật thất bại");
			return data;
		},
		onSuccess: () => {
			toast.success("Đã xóa tin nổi bật");
			queryClient.invalidateQueries({ queryKey: ["profileHighlights", username] });
			setViewerHighlight(null);
		},
		onError: (error) => toast.error(error.message),
	});

	const handleCreate = async (payload) => {
		if (editingHighlight) {
			await updateMutation.mutateAsync({ id: editingHighlight._id, ...payload });
		} else {
			await createMutation.mutateAsync(payload);
		}
	};

	const handleEdit = (highlight) => {
		setViewerHighlight(null);
		setEditingHighlight(highlight);
	};

	const handleDelete = async (highlight) => {
		if (!window.confirm(`Xóa tin nổi bật "${highlight.title}"?`)) return;
		await deleteMutation.mutateAsync(highlight._id);
	};

	const displayedHighlights = useMemo(() => highlights, [highlights]);

	if (isLoading) {
		return (
			<div className="px-6 py-4">
				<div className="flex gap-5 overflow-hidden">
					{[1, 2, 3].map((item) => (
						<div key={item} className="flex flex-shrink-0 flex-col items-center gap-2">
							<div className="h-16 w-16 animate-pulse rounded-full bg-slate-200" />
							<div className="h-3 w-14 animate-pulse rounded-full bg-slate-200" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<>
			{isOwnProfile && isArchivedStoriesLoading && (
				<div className="px-6 py-2 text-xs font-medium text-slate-400">Đang tải kho lưu trữ tin...</div>
			)}

			<div className="flex items-center justify-between px-6 pt-4">
				<div>
					<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Tin nổi bật</p>
					<p className="mt-1 text-xs text-slate-500">
						{isOwnProfile ? "Ghim các khoảnh khắc quan trọng lên hồ sơ." : "Những bộ tin đã được ghim."}
					</p>
				</div>
			</div>

			<div className="pt-4 pb-2">
				<div className="hide-scrollbar flex gap-5 overflow-x-auto px-6 pb-3">
					{isOwnProfile && (
						<button
							type="button"
							onClick={() => {
								setEditingHighlight(null);
								setIsCreateOpen(true);
							}}
							className="flex flex-shrink-0 flex-col items-center gap-2 group"
						>
							<div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 transition-colors group-hover:border-indigo-400 group-hover:bg-indigo-50">
								<Plus className="h-6 w-6 text-slate-400 transition-colors group-hover:text-indigo-500" />
							</div>
							<span className="text-[11px] font-semibold uppercase text-slate-500">Mới</span>
						</button>
					)}

					{displayedHighlights.length === 0 && !isOwnProfile ? (
						<div className="flex items-center rounded-full border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
							Chưa có tin nổi bật
						</div>
					) : (
						displayedHighlights.map((highlight) => (
							<button
								key={highlight._id}
								type="button"
								onClick={() => setViewerHighlight(highlight)}
								className="flex flex-shrink-0 flex-col items-center gap-2 group"
							>
								<div className="rounded-full border-2 border-slate-200 p-[2px] transition-colors group-hover:border-indigo-400">
									<div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white">
										<img
											src={highlight.coverImage || "/avatar-placeholder.png"}
											alt={highlight.title}
											className="h-full w-full object-cover"
										/>
									</div>
								</div>
								<span className="max-w-[72px] truncate text-[11px] font-semibold text-slate-700">
									{highlight.title}
								</span>
							</button>
						))
					)}
				</div>
			</div>

			<CreateHighlightModal
				isOpen={isCreateOpen || !!editingHighlight}
				mode={editingHighlight ? "edit" : "create"}
				stories={editingHighlight?.stories?.length ? editingHighlight.stories : archivedStories}
				initialHighlight={editingHighlight}
				isSubmitting={createMutation.isPending || updateMutation.isPending}
				onClose={() => {
					setIsCreateOpen(false);
					setEditingHighlight(null);
				}}
				onSubmit={handleCreate}
			/>

			<HighlightViewerModal
				isOpen={!!viewerHighlight}
				highlight={viewerHighlight}
				isOwnProfile={isOwnProfile}
				onClose={() => setViewerHighlight(null)}
				onEdit={handleEdit}
				onDelete={handleDelete}
			/>
		</>
	);
};

export default HighlightsList;
