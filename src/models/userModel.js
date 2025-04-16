import { time } from "framer-motion";
import mongoose from "mongoose";

const linkedinSpecs = new mongoose.Schema({
    audience: {
        type: String,
        required: true
    },
    niche: {
        type: String,
        required: true
    },
    narrative: {
        type: String,
        required: true
    },
    postExamples: {
        type: [String],
        required: true
    },
    postScheduleFix: {
        type: Boolean,
        required: true,
        default: true
    },
    postScheduleFixTime:{
        type: String,
        required: false,
        default: "09:00"
    },
    timezone: {
        type: String,
        required: true,
        default: "UTC"
    },
});

const subscription = new mongoose.Schema({
    status: {
        type: String,
        enum: ["active", "inactive"],
        required: true,
    }, 
    plan: {
        type: String,
        enum: ["free", "freeTrial", "premiumMonthly", "premiumYearly"],
        required: true,
        default: "free"
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true,
    },
    cashFreeSubscriptionId: {
        type: String,
        required: true,
        unique: true
    },
    cashFreeCustomerId: {
        type: String,
        required: true,
        unique: true
    },
});

const userSchema = new mongoose.Schema({
    linkedinId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        required: true
    },
    linkedinAccessToken: {
        type: String,
        required: false
    },
    linkedinTokenExpiry: {
        type: Date,
        required: false
    },
    linkedinSpecs: {
        type: linkedinSpecs,
        required: false
    },
    subscription: {
        type: subscription,
        required: false,
    }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;