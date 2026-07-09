const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تحديد مسار رفع الملفات الجديدة فقط
const uploadDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../uploads');
if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// إعداد التخزين المحلي باستخدام Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // إنشاء اسم مميز للملف لتجنب التكرار
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
    },
});

// فلتر للتحقق من أن الملف المرفوع هو صورة فقط
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('يرجى رفع صور فقط'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // الحد الأقصى 2 ميجابايت
    },
    fileFilter: fileFilter,
});

module.exports = upload;
