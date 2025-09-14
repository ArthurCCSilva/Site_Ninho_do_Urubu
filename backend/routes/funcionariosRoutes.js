// backend/routes/funcionariosRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/funcionariosController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin);

router.post('/', ctrl.create);

module.exports = router;