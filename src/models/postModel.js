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
    postStatus: {
        type: String,
        enum: ["draft", "published", "scheduled"],
        required: true,
        default: "draft"
    }
});

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

export default Post;