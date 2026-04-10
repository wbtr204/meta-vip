import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
    {
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
        allowRegistration: {
            type: Boolean,
            default: true,
        },
        postThreshold: {
            type: Number,
            default: 100,
        },
        userMaxCache: {
            type: String,
            default: "512MB",
        },
        emergencyStop: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);

const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema);

export default SystemConfig;
