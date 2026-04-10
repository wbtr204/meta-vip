import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Notification from "./models/notification.model.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function purgeMessageNotifications() {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI not found!");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB for cleanup...");

        const result = await Notification.deleteMany({ type: "message" });
        console.log(`✅ Success: Deleted ${result.deletedCount} legacy message notifications from the central system.`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error during cleanup:", error);
        process.exit(1);
    }
}

purgeMessageNotifications();
