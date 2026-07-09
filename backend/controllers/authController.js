const jwt = require('jsonwebtoken');
const User = require('../models/User');

// دالة مساعدة لإنشاء JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// @desc    تسجيل مستخدم جديد
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // التحقق من عدم وجود الإيميل مسبقاً
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني مسجل بالفعل.',
            });
        }

        // إنشاء المستخدم (كلمة المرور ستُشفَّر تلقائياً في الـ Model)
        const user = await User.create({ name, email, phone, password });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم.',
            error: error.message,
        });
    }
};

// @desc    تسجيل الدخول
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // التحقق من وجود الإيميل وكلمة المرور
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
            });
        }

        // جلب المستخدم مع كلمة المرور (select: false في الـ schema يمنع ظهورها افتراضياً)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
            });
        }

        // مقارنة كلمة المرور
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم.',
            error: error.message,
        });
    }
};

// @desc    جلب بيانات المستخدم الحالي
// @route   GET /api/auth/me
// @access  Private (يحتاج Token)
const getMe = async (req, res) => {
    try {
        // req.user موجود بالفعل من authMiddleware
        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                role: req.user.role,
                createdAt: req.user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم.',
            error: error.message,
        });
    }
};

module.exports = { register, login, getMe };
