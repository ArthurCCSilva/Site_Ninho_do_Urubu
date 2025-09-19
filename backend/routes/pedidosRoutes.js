// backend/routes/pedidosRoutes.js
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
// ✅ Importamos 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// --- ROTAS PARA CLIENTES LOGADOS ---
// ✅ ESTA SEÇÃO ESTÁ PERFEITA E NÃO FOI ALTERADA.
router.post('/', [verifyToken], pedidosController.criarPedido);
router.get('/meus-pedidos', [verifyToken], pedidosController.getPedidosUsuario);
router.get('/meus-pedidos/counts', [verifyToken], pedidosController.getDashboardCounts);
router.get('/meus-boletos', [verifyToken], pedidosController.getBoletosAprovadosUsuario);
router.get('/boleto-planos-carrinho', [verifyToken], pedidosController.getBoletoPlansForCart);
router.get('/:id', [verifyToken], pedidosController.getPedidoDetalhes);
router.patch('/:id/cancelar', [verifyToken], pedidosController.cancelarPedido);


// --- ROTAS EXCLUSIVAS PARA ADMIN E FUNCIONÁRIOS AUTORIZADOS ---

// ✅ As rotas abaixo foram atualizadas para usar 'hasPermission' com a chave correta.

// Busca TODOS os pedidos para o painel do admin
router.get('/admin/todos', [verifyToken, hasPermission('admin_gerenciar_pedidos')], pedidosController.getTodosPedidosAdmin);

// Cria um pedido a partir da tela de "Venda Física"
router.post('/admin/venda-fisica', [verifyToken, hasPermission('admin_registrar_venda_fisica')], pedidosController.criarVendaFisica);

// Atualiza o status de um pedido
router.patch('/:id/status', [verifyToken, hasPermission('admin_gerenciar_pedidos')], pedidosController.updateStatusPedido);

// Admin cancela um pedido (com motivo)
router.patch('/admin/:id/cancelar', [verifyToken, hasPermission('admin_gerenciar_pedidos')], pedidosController.cancelarPedidoAdmin);

// Admin edita a quantidade de um item em um pedido existente
router.patch('/itens/:itemId', [verifyToken, hasPermission('admin_gerenciar_pedidos')], pedidosController.updateItemPedido);

// Admin adiciona um pagamento parcial a um pedido "Fiado"
router.post('/:id/pagamento-fiado', [verifyToken, hasPermission('sistema_fiado')], pedidosController.adicionarPagamentoFiado);

module.exports = router;