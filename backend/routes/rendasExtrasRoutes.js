// backend/routes/rendasExtrasRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rendasExtrasController');
// ✅ Importamos o middleware 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// ❌ A regra geral 'router.use()' foi removida.

// ✅ Cada rota agora é protegida pela permissão 'admin_painel_financeiro'
router.get('/', [verifyToken, hasPermission('admin_painel_financeiro')], ctrl.getRendasExtras);
router.post('/', [verifyToken, hasPermission('admin_painel_financeiro')], ctrl.adicionarRendaExtra);

module.exports = router;