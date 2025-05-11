import mongoose from "mongoose";
import { boolean } from "zod";

const postSchema = new mongoose.Schema({
    linkedinId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    postContent: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: false
    },
    imageUrls: {
        type: [String],
        required: false
    },
    externalLink: {
        type: String,
        required: false
    },
    postStatus: {
        type: String,
        enum: ["draft", "published", "scheduled", "failed"],
        required: true,
        default: "draft"
    },
    postSpecificSchedule: {
        type: Boolean,
        required: true,
        default: false
    },
    scheduleTime: {
        type: Date,
        required: false,
        default: null
    },
    timeCreated: {
        type: Date,
        default: Date.now
    },
    timeUpdated: {
        type: Date,
        default: Date.now
    },
    timePublished: {
        type: Date
    }
});

// Improve the pre-save hook to ensure scheduleTime is always a valid Date object
postSchema.pre('save', function(next) {
    if (this.postStatus === 'scheduled' && this.postSpecificSchedule === true) {
        if (!this.scheduleTime) {
            this.scheduleTime = new Date(Date.now() + 60000); // Default 1 minute in future
        } else if (!(this.scheduleTime instanceof Date)) {
            // Ensure scheduleTime is a Date object
            this.scheduleTime = new Date(this.scheduleTime);
        }
    }
    next();
});

// Improve isReadyToPublish method to handle date comparison more safely
postSchema.methods.isReadyToPublish = function() {
    if (this.postStatus !== 'scheduled') return false;
    
    if (this.postSpecificSchedule && this.scheduleTime) {
        const now = new Date();
        const scheduleDate = new Date(this.scheduleTime);
        return now >= scheduleDate;
    }
    return false;
};

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

export default Post;