const ProfileHeaderSkeleton = () => {
	return (
		<div className="min-h-screen bg-slate-50 px-4 pt-24">
			<div className="mx-auto flex max-w-7xl justify-center gap-8">
				<div className="hidden w-64 lg:block" />

				<div className="w-full max-w-2xl space-y-6">
					<div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm">
						<div className="skeleton h-48 w-full rounded-none" />
						<div className="px-6">
							<div className="-mt-16 mb-4 flex items-end justify-between gap-4">
								<div className="skeleton h-32 w-32 rounded-full border-4 border-white" />
								<div className="skeleton h-10 w-36 rounded-xl" />
							</div>
							<div className="space-y-3 pb-6">
								<div className="skeleton h-8 w-64 rounded-full" />
								<div className="skeleton h-4 w-48 rounded-full" />
								<div className="skeleton h-4 w-full max-w-lg rounded-full" />
								<div className="skeleton h-4 w-3/4 rounded-full" />
							</div>
						</div>
						<div className="px-6 pb-6">
							<div className="skeleton h-12 w-full rounded-xl" />
						</div>
						<div className="px-6 pb-6">
							<div className="skeleton h-4 w-28 rounded-full" />
							<div className="mt-4 flex gap-4 overflow-hidden">
								{[1, 2, 3, 4].map((item) => (
									<div key={item} className="flex flex-col items-center gap-2">
										<div className="skeleton h-16 w-16 rounded-full" />
										<div className="skeleton h-3 w-14 rounded-full" />
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="skeleton h-80 w-full rounded-[1.25rem]" />
				</div>

				<div className="hidden w-72 xl:block" />
			</div>
		</div>
	);
};

export default ProfileHeaderSkeleton;
