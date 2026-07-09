const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// تحميل المتغيرات البيئية
dotenv.config();

// الاتصال بقاعدة البيانات
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));       // لقبول JSON + الصور الكبيرة
app.use(express.urlencoded({ extended: true }));

// جعل مجلد الصور متاحاً للـ Frontend
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/specialties', require('./routes/specialtyRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Route للتأكد إن الـ Server شغال
app.get('/', (req, res) => {
    res.json({ success: true, message: '✅ مستشفى الحياة API - شغال' });
});

// معالجة الـ Routes غير الموجودة
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'المسار غير موجود.' });
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
