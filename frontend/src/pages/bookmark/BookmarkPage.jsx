import { useQuery } from "@tanstack/react-query";
import Post from "../../components/common/Post";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const BookmarkPage = () => {
	const { data: bookmarks, isLoading } = useQuery({
		queryKey: ["bookmarks"],
		queryFn: async () => {
			try {
				const res = await fetch("/api/posts/bookmarks");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Something went wrong");
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
	});

	return (
		<div className='flex-[4_4_0] border-r border-base-300 min-h-screen'>
			<div className='flex flex-col'>
				<div className='p-4 px-4 sm:px-6 border-b border-base-300'>
					<p className='font-bold text-lg'>Dấu trang</p>
					<p className='text-slate-500 text-sm'>@{bookmarks?.length || 0} bài viết</p>
				</div>
				{isLoading && (
					<div className='flex justify-center my-4'>
						<LoadingSpinner size='lg' />
					</div>
				)}
				{!isLoading && bookmarks?.length === 0 && (
					<div className='text-center p-4 text-slate-500'>Bạn chưa lưu bài viết nào.</div>
				)}
				{!isLoading && bookmarks?.map((post) => (
					<Post key={post._id} post={post} />
				))}
			</div>
		</div>
	);
};

export default BookmarkPage;
