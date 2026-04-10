import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Post from "../models/post.model.js";
import Hashtag from "../models/hashtag.model.js";
import { extractKeywords } from "../utils/keywordExtractor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const analyzePosts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const posts = await Post.find({});
        console.log(`Analyzing ${posts.length} posts...`);

        // Reset existing hashtags/trends if you want a clean slate (Optional)
        // await Hashtag.deleteMany({});

        for (const post of posts) {
            const keywords = extractKeywords(post.text);
            const manualHashtags = post.hashtags || [];
            const allKeywords = [...new Set([...keywords, ...manualHashtags])];

            if (allKeywords.length > 0) {
                console.log(`Processing keywords for post ${post._id}:`, allKeywords.join(", "));
                
                for (const tag of allKeywords) {
                    if (tag.length > 2) {
                        await Hashtag.updateOne(
                            { text: tag }, 
                            { $inc: { count: 1 } }, 
                            { upsert: true }
                        );
                    }
                }
            }
        }

        console.log("Analysis complete! Trending data populated.");
        process.exit(0);
    } catch (error) {
        console.error("Error during post analysis:", error);
        process.exit(1);
    }
};

analyzePosts();
