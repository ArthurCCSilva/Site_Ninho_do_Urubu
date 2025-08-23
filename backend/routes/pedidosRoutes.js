// backend/routes/pedidosRoutes.js
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protege todas as rotas de pedidos
router.use(verifyToken);

router.post('/', pedidosController.criarPedido);
router.get('/meus-pedidos', pedidosController.getPedidosUsuario);
router.get('/:id', pedidosController.getPedidoDetalhes);
router.patch('/:id/cancelar', pedidosController.cancelarPedido);

module.exports = router;