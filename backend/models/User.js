const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'الاسم مطلوب'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'البريد الإلكتروني مطلوب'],
            unique: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'يرجى إدخال بريد إلكتروني صحيح'],
        },
        phone: {
            type: String,
            required: [true, 'رقم الهاتف مطلوب'],
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'كلمة المرور مطلوبة'],
            minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'],
            select: false, // لا تُرجع كلمة المرور في الاستعلامات افتراضياً
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
    },
    { timestamps: true }
);

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// دالة مقارنة كلمة المرور عند تسجيل الدخول
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
