const Specialty = require('../models/Specialty');
const fs = require('fs');
const path = require('path');

// @desc    جلب جميع التخصصات
// @route   GET /api/specialties
// @access  Public
const getAllSpecialties = async (req, res) => {
    try {
        const specialties = await Specialty.find({});
        res.status(200).json({ success: true, data: specialties });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// @desc    إضافة تخصص جديد
// @route   POST /api/specialties
// @access  Private/Admin
const createSpecialty = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        let imagePath = 'default-specialty.png';
        if (req.file) {
            imagePath = req.file.filename; // حفظ اسم الملف المرفوع
        }

        const specialty = await Specialty.create({
            name,
            description,
            image: imagePath
        });

        res.status(201).json({ success: true, data: specialty });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'هذا التخصص موجود بالفعل' });
        }
        res.status(500).json({ success: false, message: 'خطأ في الخادم', error: error.message });
    }
};

// @desc    حذف تخصص
// @route   DELETE /api/specialties/:id
// @access  Private/Admin
const deleteSpecialty = async (req, res) => {
    try {
        const specialty = await Specialty.findById(req.params.id);
        
        if (!specialty) {
            return res.status(404).json({ success: false, message: 'التخصص غير موجود' });
        }

        // حذف الصورة من السيرفر إذا لم تكن الصورة الافتراضية
        if (specialty.image !== 'default-specialty.png') {
            const imagePath = path.join(__dirname, '../uploads/', specialty.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await specialty.deleteOne();
        res.status(200).json({ success: true, message: 'تم حذف التخصص بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// @desc    تحديث تخصص
// @route   PUT /api/specialties/:id
// @access  Private/Admin
const updateSpecialty = async (req, res) => {
    try {
        const { name, description } = req.body;
        const specialty = await Specialty.findById(req.params.id);

        if (!specialty) {
            return res.status(404).json({ success: false, message: 'التخصص غير موجود' });
        }

        specialty.name = name || specialty.name;
        specialty.description = description || specialty.description;

        if (req.file) {
            // حذف الصورة القديمة إذا لم تكن الافتراضية
            if (specialty.image !== 'default-specialty.png') {
                const oldImagePath = path.join(__dirname, '../uploads/', specialty.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            specialty.image = req.file.filename;
        }

        const updatedSpecialty = await specialty.save();
        res.status(200).json({ success: true, data: updatedSpecialty });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'هذا التخصص موجود بالفعل' });
        }
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

module.exports = {
    getAllSpecialties,
    createSpecialty,
    deleteSpecialty,
    updateSpecialty
};
