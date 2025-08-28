// backend/routes/financialsRoutes.js
const express = require('express');
const router = express.Router();
const financialsController = require('../controllers/financialsController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin); // Protege todas as rotas financeiras

router.get('/summary', financialsController.getSummary);
router.get('/sales-over-time', financialsController.getSalesOverTime);

module.exports = router;