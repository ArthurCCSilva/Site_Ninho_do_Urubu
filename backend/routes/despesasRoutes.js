// backend/routes/despesasRoutes.js
const express = require('express');
const router = express.Router();
const despesasController = require('../controllers/despesasController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Todas as rotas de despesas são apenas para admins
router.use(verifyToken, isAdmin);

router.post('/', despesasController.adicionarDespesa);

module.exports = router;