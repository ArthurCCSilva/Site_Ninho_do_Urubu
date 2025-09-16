// backend/routes/funcoesRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/funcoesController');
// ✅ Importamos o middleware 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// ❌ A regra geral 'router.use()' foi removida.

// ✅ Todas as rotas agora são protegidas pela permissão 'gerenciarFuncoes',
// garantindo que qualquer usuário autorizado possa gerenciar funções por completo.
router.get('/', [verifyToken, hasPermission('gerenciarFuncoes')], ctrl.getAll);
router.post('/', [verifyToken, hasPermission('gerenciarFuncoes')], ctrl.create);
router.put('/:id', [verifyToken, hasPermission('gerenciarFuncoes')], ctrl.update);
router.delete('/:id', [verifyToken, hasPermission('gerenciarFuncoes')], ctrl.delete);
router.get('/permissoes', [verifyToken, hasPermission('gerenciarFuncoes')], ctrl.getAllPermissoes);

module.exports = router;