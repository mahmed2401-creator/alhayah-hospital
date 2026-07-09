const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// تحميل المتغيرات البيئية
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== API Routes (قبل الـ static files!) =====
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/specialties', require('./routes/specialtyRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// إحصائيات لوحة التحكم (طلب واحد بدل 4)
app.get('/api/stats', async (req, res) => {
    try {
        const User = require('./models/User');
        const Booking = require('./models/Booking');
        const Doctor = require('./models/Doctor');
        const Specialty = require('./models/Specialty');

        const [patients, bookings, doctors, specialties] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Booking.countDocuments(),
            Doctor.countDocuments(),
            Specialty.countDocuments()
        ]);

        res.json({ success: true, data: { patients, bookings, doctors, specialties } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
});

// مجلد الصور الثابتة (من Git)
const staticUploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(staticUploadsDir));


// ===== Frontend Static Files =====
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// أي route تاني يروح لـ index.html (Express 5 compatible)
app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// الاتصال بقاعدة البيانات أولاً
connectDB().catch(err => {
    console.error('DB connection failed:', err.message);
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
