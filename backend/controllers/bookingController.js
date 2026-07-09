const Booking = require('../models/Booking');

// @desc    جلب جميع الحجوزات (للأدمن)
// @route   GET /api/bookings
// @access  Private/Admin
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate('user', 'name phone')
            .populate('doctor', 'name');
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// @desc    جلب حجوزات المستخدم الحالي
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('doctor', 'name');
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// @desc    إنشاء حجز جديد
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    try {
        const { doctor, visitType, time, slotKey, date } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'يرجى إرفاق صورة الإيصال' });
        }

        const receiptImage = req.file.filename;

        const booking = await Booking.create({
            user: req.user._id,
            doctor,
            visitType,
            time,
            slotKey,
            date: date || Date.now(),
            receiptImage
        });

        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم', error: error.message });
    }
};

// @desc    تحديث حالة الحجز
// @route   PATCH /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'confirmed' أو 'cancelled'
        
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'الحجز غير موجود' });
        }

        booking.status = status;
        await booking.save();

        res.status(200).json({ success: true, message: 'تم تحديث حالة الحجز بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

module.exports = {
    getAllBookings,
    getMyBookings,
    createBooking,
    updateBookingStatus
};
