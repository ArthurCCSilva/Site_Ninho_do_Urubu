// backend/routes/comandaRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/comandaController');
// ✅ Importamos o 'verifyToken' e nosso novo middleware 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// ❌ A regra geral 'router.use()' foi removida.

// ✅ Cada rota agora é protegida individualmente, exigindo a permissão específica.
router.get('/', [verifyToken, hasPermission('admin_gerenciar_comandas')], ctrl.getAllAbertas);
router.post('/', [verifyToken, hasPermission('admin_gerenciar_comandas')], ctrl.criarComanda);
router.get('/:id', [verifyToken, hasPermission('admin_gerenciar_comandas')], ctrl.getDetalhesComanda);
router.post('/item', [verifyToken, hasPermission('admin_gerenciar_comandas')], ctrl.adicionarItem);
router.put('/item/:itemId', [verifyToken, hasPermission('admin_gerenciar_comandas')], ctrl.updateItemQuantidade);
router.delete('/item/:itemId', [verifyToken, hasPermission('admin_gerenciar_comandas')], ctrl.removerItem);
router.post('/:comandaId/fechar', [verifyToken, hasPermission('admin_gerenciar_comandas')], ctrl.fecharComanda);

module.exports = router;