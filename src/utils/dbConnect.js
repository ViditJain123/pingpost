import mongoose from 'mongoose';
const connection = {};

async function dbConnect() {
    if (connection.isConnected) {
        console.log("Already Connected");
        return;
    }
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        connection.isConnected = db.connections[0].readyState;
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

export default dbConnect;