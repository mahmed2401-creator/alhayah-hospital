const express = require('express');
const router = express.Router();
const { getAllDoctors, getDoctorById, getBookedSlots, createDoctor, deleteDoctor, updateDoctor } = require('../controllers/doctorController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.route('/')
    .get(getAllDoctors)
    .post(authMiddleware, adminMiddleware, upload.single('image'), createDoctor);

router.get('/:id/slots', getBookedSlots);

router.route('/:id')
    .get(getDoctorById)
    .put(authMiddleware, adminMiddleware, upload.single('image'), updateDoctor)
    .delete(authMiddleware, adminMiddleware, deleteDoctor);

module.exports = router;
