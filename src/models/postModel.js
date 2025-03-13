import mongoose from "mongoose";

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
        enum: ["draft", "published", "scheduled"],
        required: true,
        default: "draft"
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

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

export default Post;