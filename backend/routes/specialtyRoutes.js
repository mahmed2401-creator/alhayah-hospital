const express = require('express');
const router = express.Router();
const { getAllSpecialties, createSpecialty, deleteSpecialty, updateSpecialty } = require('../controllers/specialtyController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.route('/')
    .get(getAllSpecialties)
    // الإضافة تحتاج توكن، ويجب أن يكون أدمن، وتقبل صورة
    .post(authMiddleware, adminMiddleware, upload.single('image'), createSpecialty);

router.route('/:id')
    .put(authMiddleware, adminMiddleware, upload.single('image'), updateSpecialty)
    .delete(authMiddleware, adminMiddleware, deleteSpecialty);

module.exports = router;
