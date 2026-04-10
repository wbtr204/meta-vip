import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";

const Posts = ({ feedType, username, userId, onDataLoad }) => {
	const [page, setPage] = useState(1);
	const [allPosts, setAllPosts] = useState([]);
	const [hasMore, setHasMore] = useState(true);
	const limit = 10;

	const getPostEndpoint = () => {
		const baseUrl = (() => {
			switch (feedType) {
				case "forYou":
					return "/api/posts/all";
				case "following":
					return "/api/posts/following";
				case "posts":
					return `/api/posts/user/${username}`;
				case "likes":
					return `/api/posts/likes/${userId}`;
				default:
					return "/api/posts/all";
			}
		})();

		return `${baseUrl}?page=${page}&limit=${limit}`;
	};

	const POST_ENDPOINT = getPostEndpoint();

	const {
		data: posts,
		isLoading,
		isRefetching,
	} = useQuery({
		queryKey: ["posts", feedType, username, userId, page],
		queryFn: async () => {
			const res = await fetch(POST_ENDPOINT);
			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Something went wrong");
			}

			return data;
		},
	});

	useEffect(() => {
		setPage(1);
		setAllPosts([]);
		setHasMore(true);
	}, [feedType, username, userId]);

	useEffect(() => {
		if (!posts) return;

		if (page === 1) {
			setAllPosts(posts);
			onDataLoad?.(posts.length);
		} else {
			setAllPosts((prev) => [...prev, ...posts]);
		}

		if (posts.length < limit) {
			setHasMore(false);
		}
	}, [posts, page, onDataLoad]);

	return (
		<>
			{(isLoading || isRefetching) && page === 1 && (
				<div className="flex flex-col justify-center">
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}

			{!isLoading && !isRefetching && allPosts?.length === 0 && (
				<div className="my-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
					<p className="text-sm font-semibold text-slate-500">Không có bài đăng nào</p>
				</div>
			)}

			{allPosts && (
				<div>
					{allPosts.map((post) => (
						<Post key={post._id} post={post} />
					))}
				</div>
			)}

			{hasMore && allPosts.length > 0 && (
				<div className="flex justify-center my-4">
					<button
						className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-60"
						onClick={() => setPage((prev) => prev + 1)}
						disabled={isLoading || isRefetching}
					>
						{isLoading || isRefetching ? "Đang tải..." : "Xem thêm"}
					</button>
				</div>
			)}
		</>
	);
};

export default Posts;
