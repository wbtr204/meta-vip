import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fakerVI as faker } from "@faker-js/faker"; // Vietnamese localization

import User from "./models/user.model.js";
import Post from "./models/post.model.js";
import Story from "./models/story.model.js";
import Hashtag from "./models/hashtag.model.js";

// Ensure we load the root .env file regardless of where the script is executed
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const TOTAL_USERS = 200;
const TOTAL_POSTS = 400;
const TOTAL_STORIES = 150;
const DEFAULT_PASSWORD = "password123";

async function seedData() {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI not found in .env string!");

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected successfully to DB!");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

        const newUsers = [];
        const userLogs = [];

        console.log(`Generating ${TOTAL_USERS} users...`);
        for (let i = 0; i < TOTAL_USERS; i++) {
            const fullName = faker.person.fullName();
            // Generate clean username avoiding spaces and special chars
            const safeUsernameBase = Buffer.from(fullName.split(' ')[0], 'utf-8').toString('ascii').replace(/[^a-zA-Z]/g, '').toLowerCase() || 'user';
            const username = safeUsernameBase + faker.string.alphanumeric(5).toLowerCase() + Math.floor(Math.random() * 100);
            
            const email = `${username}@vibenet.local`;
            const profileImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&size=200`;
            const coverImg = `https://picsum.photos/seed/${faker.string.uuid()}/1200/400`;
            const bio = faker.lorem.sentences(1);

            const user = new User({
                fullName,
                username,
                email,
                password: hashedPassword,
                profileImg,
                coverImg,
                bio,
                role: "user"
            });

            newUsers.push(user);
            userLogs.push({ username, email, fullName, password: DEFAULT_PASSWORD });
        }

        const insertedUsers = await User.insertMany(newUsers);
        console.log(`✅ ${insertedUsers.length} Users successfully inserted.`);

        // Clear existing Hashtags/Trends
        await Hashtag.deleteMany({});
        console.log("✅ Existing Hashtags cleared.");

        // THEME TEMPLATES for realistic analysis
        const THEMES = [
            "Đồ án tốt nghiệp sắp tới rồi, mọi người chuẩn bị đến đâu rồi? #KhoaLuan #CNTT",
            "Công nghệ React và Nodejs thực sự rất mạnh mẽ cho các dự án Web. #ReactJS #Fullstack",
            "VibeNet là một mạng xã hội tuyệt vời để kết nối sinh viên IT. #VibeNet #Friendly",
            "Mọi người nghĩ sao về ứng dụng của AI và Chatbot trong giáo dục hiện nay?",
            "Tuyển dụng thực tập sinh Web Developer cho dự án mới tại Hà Nội. #Tuyendung #Intern",
            "Cảm giác hoàn thành xong một chức năng khó trong code thật là sướng! #CodingLife",
            "Hôm nay trời đẹp, rất thích hợp để lên thư viện học lập trình Python.",
            "Chia sẻ kinh nghiệm phỏng vấn tại các công ty công nghệ lớn. #Interview #Tech",
            "Cần tìm đồng đội làm dự án khởi nghiệp về lĩnh vực Blockchain và Web3.",
            "Tại sao nên học TypeScript thay vì JavaScript thuần cho các dự án lớn?",
            "Lộ trình học Frontend cho người mới bắt đầu từ con số 0.",
            "Bí quyết quản lý thời gian hiệu quả cho sinh viên năm cuối. #StudyTips",
            "Những thư viện UI tốt nhất cho React mà bạn nên biết: Shadcn, Tailwind, HeadlessUI.",
            "Thảo luận về bảo mật trong lập trình Web và cách phòng chống SQL Injection.",
            "Ra mắt tính năng Phân tích Xu hướng mới trên VibeNet, mọi người dùng thử nhé! #Update #AI"
        ];

        // Generate Posts
        console.log(`Generating ${TOTAL_POSTS} themed and random posts...`);
        const newPosts = [];
        for (let i = 0; i < TOTAL_POSTS; i++) {
            const randomUser = insertedUsers[Math.floor(Math.random() * insertedUsers.length)];
            const hasImage = Math.random() > 0.4;
            
            // 70% chance of using a theme, 30% random lorem
            const text = Math.random() > 0.3 
                ? THEMES[Math.floor(Math.random() * THEMES.length)] 
                : faker.lorem.sentences(Math.floor(Math.random() * 2) + 1);

            const post = new Post({
                user: randomUser._id,
                text: text,
                imgs: hasImage ? [`https://picsum.photos/seed/${faker.string.uuid()}/800/600`] : [],
                hashtags: text.match(/#\w+/g)?.map(tag => tag.toLowerCase()) || [],
            });
            newPosts.push(post);
        }
        const insertedPosts = await Post.insertMany(newPosts);
        console.log(`✅ ${insertedPosts.length} Posts successfully inserted.`);

        // Generate Stories
        console.log(`Generating ${TOTAL_STORIES} random active stories...`);
        const newStories = [];
        for (let i = 0; i < TOTAL_STORIES; i++) {
            const randomUser = insertedUsers[Math.floor(Math.random() * insertedUsers.length)];
            const story = new Story({
                userId: randomUser._id,
                mediaUrl: `https://picsum.photos/seed/${faker.string.uuid()}/1080/1920`,
                mediaType: "image"
            });
            newStories.push(story);
        }
        const insertedStories = await Story.insertMany(newStories);
        console.log(`✅ ${insertedStories.length} Stories successfully inserted.`);


        // Simulating the Social Web (Followers & Following)
        console.log("Weaving the social interaction network (Followers/Following)...");
        for (let user of insertedUsers) {
            const followCount = Math.floor(Math.random() * 15) + 5; // Follows 5-20 users
            for (let i = 0; i < followCount; i++) {
                const randomFollow = insertedUsers[Math.floor(Math.random() * insertedUsers.length)];
                if (user._id.toString() !== randomFollow._id.toString() && !user.following.includes(randomFollow._id)) {
                    user.following.push(randomFollow._id);
                    randomFollow.followers.push(user._id);
                }
            }
        }
        
        // Save user docs
        console.log("Saving user social relations graph...");
        await Promise.all(insertedUsers.map(u => u.save({ validateBeforeSave: false }))); // Disable extra validation for speed

        // Simulating Post Reactions & Comments
        console.log("Simulating organic human engagement (Likes & Comments)...");
        for (let post of insertedPosts) {
            const likeCount = Math.floor(Math.random() * 25); // Max 25 likes
            for (let i = 0; i < likeCount; i++) {
                const randomLiker = insertedUsers[Math.floor(Math.random() * insertedUsers.length)];
                if (!post.reactions.some(r => r.user.toString() === randomLiker._id.toString())) {
                    post.reactions.push({ user: randomLiker._id, type: "like" });
                    randomLiker.likedPosts.push(post._id);
                }
            }

            const commentCount = Math.floor(Math.random() * 5); // 0-4 comments
            for(let i = 0; i < commentCount; i++) {
                 const commenter = insertedUsers[Math.floor(Math.random() * insertedUsers.length)];
                 post.comments.push({
                     text: faker.lorem.sentence(),
                     user: commenter._id
                 });
            }
        }

        console.log("Saving post engagement metrics...");
        await Promise.all(insertedPosts.map(p => p.save({ validateBeforeSave: false })));
        await Promise.all(insertedUsers.map(u => u.save({ validateBeforeSave: false })));

        console.log("🎉 SEEDING COMPLETED SUCCESSFULLY! Safe to exit.");
        process.exit(0);

    } catch (error) {
        console.error("❌ CRITICAL ERROR DURING SEEDING:", error);
        process.exit(1);
    }
}

seedData();
