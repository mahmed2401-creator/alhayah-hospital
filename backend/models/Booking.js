const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true,
        },
        visitType: {
            type: String,
            enum: ['عادي', 'مستعجل'],
            required: true,
        },
        time: {
            type: String, // مثال: السبت - 10:00
            required: true,
        },
        slotKey: {
            type: String, // مثال: Saturday-10:00 (يستخدم في التحقق من التعارض)
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        receiptImage: {
            type: String, // مسار صورة الإيصال المحفوظة
            required: [true, 'يجب إرفاق صورة إيصال الدفع'],
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
