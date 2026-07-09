const User = require('../models/User');

// @desc    جلب جميع المستخدمين (المرضى)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        // نجلب فقط المستخدمين اللي دورهم user
        const users = await User.find({ role: 'user' }).select('-password').sort('-createdAt');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

module.exports = {
    getAllUsers
};
