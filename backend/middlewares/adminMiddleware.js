const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'غير مصرح. هذا المسار مخصص للمشرفين فقط.',
    });
};

module.exports = adminMiddleware;
