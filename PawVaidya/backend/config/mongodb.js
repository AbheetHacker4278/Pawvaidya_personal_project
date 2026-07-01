import mongoose from 'mongoose';

const MONGO_OPTS = {
    serverSelectionTimeoutMS: 10000,  // 10s to find a server
    socketTimeoutMS: 45000,           // 45s socket idle
    heartbeatFrequencyMS: 10000,
    maxPoolSize: 10,
    retryWrites: true,
};

const connectdb = async () => {
    mongoose.set('strictQuery', false);
    mongoose.connection.on('connected', () => console.log("Database connected Successfully!"));
    mongoose.connection.on('disconnected', () => console.warn("[MongoDB] Disconnected. Will attempt to reconnect..."));
    mongoose.connection.on('error', (err) => console.error("[MongoDB] Connection error:", err.message));

    const tryConnect = async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/PawVaidya`, MONGO_OPTS);
        } catch (error) {
            console.error("Database connection failed:", error.message);
            console.warn("[MongoDB] Retrying in 5 seconds...");
            setTimeout(tryConnect, 5000);
        }
    };

    await tryConnect();
}

export default connectdb