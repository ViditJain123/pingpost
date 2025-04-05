import mongoose from "mongoose";

const individualTitle = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    titleStatus: {
        type: String,
        enum: ["selected", "unselected","generated"],
        required: true,
        default: "unselected"
    },
});

const titles = new mongoose.Schema({
    linkedinId: {
        type: String,
        required: true,
        unique: true
    },
    titles: {
        type: [individualTitle],
        required: true
    },
    status: {
        type: String,
        enum: ["rejected", "ingame","inprocess"],
        default: "ingame",
        required: true
    }
});

const Titles = mongoose.models.Titles || mongoose.model("Titles", titles);

export default Titles;