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
        default: null,
        get: (time) => time ? new Date(time) : null
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

// Add a pre-save hook to validate scheduled posts
postSchema.pre('save', function(next) {
    if (this.postStatus === 'scheduled' && this.postSpecificSchedule === true) {
        if (!this.scheduleTime) {
            this.scheduleTime = new Date(Date.now() + 60000); // Default 1 minute in future
        }
    }
    next();
});

// Add a method to check if a post is ready to be published
postSchema.methods.isReadyToPublish = function() {
    if (this.postStatus !== 'scheduled') return false;
    
    if (this.postSpecificSchedule && this.scheduleTime) {
        return new Date() >= new Date(this.scheduleTime);
    }
    return false;
};

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

export default Post;