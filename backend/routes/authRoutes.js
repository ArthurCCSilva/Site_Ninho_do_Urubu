// /routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authcontroller = require('../controllers/authController');

router.post('/register', authcontroller.register);
router.post('/login', authcontroller.login);

module.exports = router;