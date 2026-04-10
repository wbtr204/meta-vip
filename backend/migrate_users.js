import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function migrate() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected successfully!");

        const User = mongoose.model("User", new mongoose.Schema({
            fullName: String,
            normalizedFullName: String
        }));

        const users = await User.find({
            $or: [
                { normalizedFullName: "" },
                { normalizedFullName: { $exists: false } }
            ]
        });

        console.log(`Found ${users.length} users to update.`);

        let count = 0;
        for (let user of users) {
            if (user.fullName) {
                user.normalizedFullName = user.fullName
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/đ/g, "d").replace(/Đ/g, "D")
                    .toLowerCase();
                await user.save();
                count++;
                if (count % 50 === 0) console.log(`Updated ${count} users...`);
            }
        }

        console.log(`✅ Finished! Updated ${count} users.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

migrate();
