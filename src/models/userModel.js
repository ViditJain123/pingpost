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
    linkedinSpecs: {
        type: linkedinSpecs,
        required: false
    },
    subscription: {
        type: Number,
        required: true,
        default: 0
    }
});

// Check if the model exists before creating a new one
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;