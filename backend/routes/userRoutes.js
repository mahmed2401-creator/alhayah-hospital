const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// جلب جميع المرضى للأدمن
router.get('/', authMiddleware, adminMiddleware, getAllUsers);

module.exports = router;
