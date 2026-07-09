const express = require('express');
const router = express.Router();
const { getAllBookings, getMyBookings, createBooking, updateBookingStatus } = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// إنشاء حجز للمريض
router.post('/', authMiddleware, upload.single('receiptImage'), createBooking);

// جلب حجوزات المريض نفسه
router.get('/my', authMiddleware, getMyBookings);

// جلب كل الحجوزات للأدمن
router.get('/', authMiddleware, adminMiddleware, getAllBookings);

// تحديث حالة حجز معين للأدمن
router.patch('/:id/status', authMiddleware, adminMiddleware, updateBookingStatus);

module.exports = router;
