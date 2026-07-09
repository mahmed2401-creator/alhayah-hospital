const Doctor = require('../models/Doctor');
const fs = require('fs');
const path = require('path');

// @desc    جلب جميع الأطباء مع التخصصات
// @route   GET /api/doctors
// @access  Public
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({}).populate('specialty', 'name');
        res.status(200).json({ success: true, data: doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// @desc    جلب طبيب واحد
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('specialty', 'name');
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
        }
        res.status(200).json({ success: true, data: doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// @desc    جلب الفترات المحجوزة لطبيب
// @route   GET /api/doctors/:id/slots
// @access  Public
const getBookedSlots = async (req, res) => {
    try {
        const Booking = require('../models/Booking');
        // جلب الحجوزات القادمة أو المعلقة أو المؤكدة لهذا الطبيب فقط
        const bookings = await Booking.find({ 
            doctor: req.params.id,
            status: { $in: ['pending', 'confirmed'] } 
        });
        
        // استخراج مفاتيح الفترات المحجوزة
        const bookedSlots = bookings.map(b => b.slotKey);
        
        res.status(200).json({ success: true, data: bookedSlots });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// @desc    إضافة طبيب جديد
// @route   POST /api/doctors
// @access  Private/Admin
const createDoctor = async (req, res) => {
    try {
        const { name, specialty, title, bio, experience, normalPrice, urgentPrice, slotDuration, workingDays } = req.body;

        let imagePath = 'default-doctor.png';
        if (req.file) {
            imagePath = req.file.filename;
        }

        // بما أن الـ frontend قد يرسل workingDays كنص JSON
        let parsedWorkingDays = workingDays;
        if (typeof workingDays === 'string') {
            parsedWorkingDays = JSON.parse(workingDays);
        }

        const doctor = await Doctor.create({
            name,
            specialty,
            title,
            bio,
            experience,
            normalPrice,
            urgentPrice,
            slotDuration,
            workingDays: parsedWorkingDays,
            image: imagePath
        });

        res.status(201).json({ success: true, data: doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم', error: error.message });
    }
};

// @desc    حذف طبيب
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
        }

        if (doctor.image !== 'default-doctor.png') {
            const imagePath = path.join(__dirname, '../uploads/', doctor.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await doctor.deleteOne();
        res.status(200).json({ success: true, message: 'تم حذف الطبيب بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// @desc    تحديث طبيب
// @route   PUT /api/doctors/:id
// @access  Private/Admin
const updateDoctor = async (req, res) => {
    try {
        const { name, specialty, title, bio, experience, normalPrice, urgentPrice, slotDuration, workingDays } = req.body;
        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
        }

        doctor.name = name || doctor.name;
        doctor.specialty = specialty || doctor.specialty;
        doctor.title = title || doctor.title;
        doctor.bio = bio || doctor.bio;
        doctor.experience = experience || doctor.experience;
        doctor.normalPrice = normalPrice || doctor.normalPrice;
        doctor.urgentPrice = urgentPrice || doctor.urgentPrice;
        doctor.slotDuration = slotDuration || doctor.slotDuration;

        if (workingDays) {
            if (typeof workingDays === 'string') {
                doctor.workingDays = JSON.parse(workingDays);
            } else {
                doctor.workingDays = workingDays;
            }
        }

        if (req.file) {
            if (doctor.image !== 'default-doctor.png') {
                const oldImagePath = path.join(__dirname, '../uploads/', doctor.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            doctor.image = req.file.filename;
        }

        const updatedDoctor = await doctor.save();
        res.status(200).json({ success: true, data: updatedDoctor });

    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الخادم', error: error.message });
    }
};

module.exports = {
    getAllDoctors,
    getDoctorById,
    getBookedSlots,
    createDoctor,
    deleteDoctor,
    updateDoctor
};
