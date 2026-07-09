const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (cachedPromise) {
        await cachedPromise;
        return mongoose.connection;
    }

    try {
        cachedPromise = mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        await cachedPromise;
        console.log(`✅ MongoDB Connected`);
        return mongoose.connection;
    } catch (error) {
        cachedPromise = null; 
        console.error(`❌ MongoDB Error: ${error.message}`);
        
        if (!process.env.VERCEL) {
            process.exit(1);
        }
        throw error;
    }
};

module.exports = connectDB;
