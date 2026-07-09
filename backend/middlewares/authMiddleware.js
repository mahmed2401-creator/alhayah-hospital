const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    let token;

    // التحقق من وجود التوكن في الـ Header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح. يرجى تسجيل الدخول أولاً.',
        });
    }

    try {
        // فك تشفير التوكن
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // جلب بيانات المستخدم من DB وإضافته للـ request
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم غير موجود.',
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'التوكن غير صالح أو انتهت صلاحيته.',
        });
    }
};

module.exports = authMiddleware;
