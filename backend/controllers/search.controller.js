import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Hashtag from "../models/hashtag.model.js";

export const globalSearch = async (req, res) => {
	try {
		const { q } = req.query;

		if (!q || q.length === 0) {
			return res.status(200).json({ users: [], posts: [], hashtags: [] });
		}

		const userRegex = new RegExp(`^${q}`, "i");
        const hashtagRegex = new RegExp(`^#?${q}`, "i");

		const searchUsersPromise = User.find({
			$or: [{ username: { $regex: userRegex } }, { fullName: { $regex: userRegex } }],
		})
			.select("-password")
			.limit(5);

        const searchHashtagsPromise = Hashtag.find({
            text: { $regex: hashtagRegex }
        })
            .limit(5);

		const searchPostsPromise = Post.aggregate([
			{ $match: { $text: { $search: q } } },
			{ $sort: { score: { $meta: "textScore" } } },
			{ $limit: 10 },
			{
				$lookup: {
					from: "users",
					localField: "user",
					foreignField: "_id",
					as: "user",
				},
			},
			{ $unwind: "$user" },
			{
				$project: {
					text: 1,
					img: 1,
                    imgs: 1,
					createdAt: 1,
					"user._id": 1,
					"user.fullName": 1,
					"user.username": 1,
					"user.profileImg": 1,
				},
			},
		]);

		const [users, posts, hashtags] = await Promise.all([
            searchUsersPromise, 
            searchPostsPromise,
            searchHashtagsPromise
        ]);

		res.status(200).json({ users, posts, hashtags });
	} catch (error) {
		console.log("Error in globalSearch controller: ", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
