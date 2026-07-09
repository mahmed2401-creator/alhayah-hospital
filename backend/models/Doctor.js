const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'اسم الطبيب مطلوب'],
            trim: true,
        },
        specialty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Specialty',
            required: [true, 'يجب تحديد تخصص الطبيب'],
        },
        title: {
            type: String, // المسمى الوظيفي (مثال: استشاري جراحة)
            required: [true, 'المسمى الوظيفي مطلوب'],
        },
        bio: {
            type: String, // السيرة الذاتية
        },
        experience: {
            type: Number, // سنوات الخبرة
            required: [true, 'سنوات الخبرة مطلوبة'],
        },
        normalPrice: {
            type: Number,
            required: [true, 'سعر الكشف العادي مطلوب'],
        },
        urgentPrice: {
            type: Number,
            required: [true, 'سعر الكشف المستعجل مطلوب'],
        },
        slotDuration: {
            type: Number,
            enum: [15, 30, 45, 60],
            default: 30,
        },
        image: {
            type: String,
            default: 'default-doctor.png',
        },
        workingDays: [
            {
                day: {
                    type: String,
                    enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    required: true,
                },
                startTime: {
                    type: String, // صيغة 24h (مثال: "10:00")
                    required: true,
                },
                endTime: {
                    type: String,
                    required: true,
                },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
