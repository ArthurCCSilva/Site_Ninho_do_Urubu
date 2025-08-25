// backend/routes/pedidosRoutes.js
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Protege todas as rotas de pedidos
router.use(verifyToken);

router.post('/', pedidosController.criarPedido);
router.get('/meus-pedidos', pedidosController.getPedidosUsuario);
router.get('/:id', pedidosController.getPedidoDetalhes);
router.patch('/:id/cancelar', pedidosController.cancelarPedido);

// 3. Rotas de Admin: O segurança da portaria já verificou o login.
//    Agora, adicionamos apenas o segurança 'isAdmin' na porta dessas salas específicas.
router.get('/admin/todos', isAdmin, pedidosController.getTodosPedidosAdmin);
router.post('/admin/venda-fisica', isAdmin, pedidosController.criarVendaFisica);
router.patch('/:id/status', isAdmin, pedidosController.updateStatusPedido);
router.patch('/:id/cancelar-admin', isAdmin, pedidosController.cancelarPedidoAdmin);

module.exports = router;