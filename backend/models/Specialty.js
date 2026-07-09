const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'اسم التخصص مطلوب'],
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'وصف التخصص مطلوب'],
        },
        image: {
            type: String, // مسار الصورة
            default: 'default-specialty.png',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Specialty', specialtySchema);
