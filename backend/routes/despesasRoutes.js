// backend/routes/despesasRoutes.js
const express = require('express');
const router = express.Router();
const despesasController = require('../controllers/despesasController');
// ✅ Importamos o middleware 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// ❌ A regra geral 'router.use()' foi removida.

// ✅ Cada rota agora é protegida pela permissão 'admin_painel_financeiro'
router.post('/', [verifyToken, hasPermission('admin_painel_financeiro')], despesasController.adicionarDespesa);
router.get('/', [verifyToken, hasPermission('admin_painel_financeiro')], despesasController.getDespesas);

module.exports = router;