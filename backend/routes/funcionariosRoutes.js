// backend/routes/funcionariosRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/funcionariosController');
// ✅ Importamos o middleware 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// ❌ A regra geral 'router.use()' foi removida.

// ✅ A rota de criação agora verifica a permissão específica
router.post('/', [verifyToken, hasPermission('admin_gerenciar_funcionarios')], ctrl.create);

module.exports = router;