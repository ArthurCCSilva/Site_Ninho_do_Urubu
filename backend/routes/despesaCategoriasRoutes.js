// backend/routes/despesaCategoriasRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/despesaCategoriasController');
// ✅ Importamos o middleware 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// ❌ A regra geral 'router.use()' foi removida.

// ✅ Cada rota agora é protegida pela permissão 'admin_painel_financeiro'
router.get('/', [verifyToken, hasPermission('admin_painel_financeiro')], ctrl.getAll);
router.post('/', [verifyToken, hasPermission('admin_painel_financeiro')], ctrl.create);
router.delete('/:id', [verifyToken, hasPermission('admin_painel_financeiro')], ctrl.delete);

module.exports = router;