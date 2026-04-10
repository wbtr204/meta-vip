import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Post from "../../components/common/Post";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FaArrowLeft } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const PostPage = () => {
	const { id } = useParams();

	const { data: post, isLoading, isError, error } = useQuery({
		queryKey: ["post", id],
		queryFn: async () => {
			try {
				const res = await fetch(`/api/posts/${id}`);
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Something went wrong");
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
	});

	if (isLoading) return (
		<div className='flex justify-center items-center h-screen'>
			<LoadingSpinner size='lg' />
		</div>
	);

	if (isError) return (
		<div className='flex justify-center items-center h-screen text-error font-bold text-xl'>
			{error.message}
		</div>
	);

	return (
		<div className='min-h-screen border-r border-white/5'>
			<div className='flex gap-10 px-6 py-4 items-center glass-morphism sticky top-0 z-10'>
				<Link to='/'>
					<motion.div whileHover={{ scale: 1.1, x: -2 }} whileTap={{ scale: 0.9 }}>
						<FaArrowLeft className='w-5 h-5 text-primary' />
					</motion.div>
				</Link>
				<h1 className='font-bold text-xl uppercase tracking-tight'>Bài đăng</h1>
			</div>

			<div className='flex flex-col'>
				{post && <Post post={post} isDetailPage={true} />}
				
				{/* Threaded Comments Section */}
				<div className='mt-4 border-t border-white/5'>
					{post?.comments?.map((comment) => (
						<div key={comment._id} className='px-4 py-2'>
							{/* Recursion or nesting would go here for real threaded replies */}
							<div className='flex gap-3 p-4 glass-morphism rounded-2xl border border-white/5 mb-2'>
								<div className='avatar'>
									<div className='w-10 rounded-xl'>
										<img src={comment.user.profileImg || "/avatar-placeholder.png"} />
									</div>
								</div>
								<div className='flex flex-col w-full'>
									<div className='flex items-center gap-2'>
										<span className='font-bold'>@{comment.user.username}</span>
										<span className='text-slate-500 text-sm'>1h</span>
									</div>
									<p className='text-sm mt-1'>{comment.text}</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default PostPage;
