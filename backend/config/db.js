const mongoose = require('mongoose');

// منع إعادة الاتصال لو موجود بالفعل (مهم لـ Vercel Serverless)
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        // لا نستخدم process.exit في Vercel
        if (!process.env.VERCEL) {
            process.exit(1);
        }
        throw error;
    }
};

module.exports = connectDB;
