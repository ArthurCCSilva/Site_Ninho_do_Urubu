// backend/routes/pedidosRoutes.js
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// --- ROTAS PARA CLIENTES LOGADOS ---

// Cria um novo pedido a partir do carrinho do usuário
router.post('/', [verifyToken], pedidosController.criarPedido);

// Busca o histórico de pedidos do usuário logado
router.get('/meus-pedidos', [verifyToken], pedidosController.getPedidosUsuario);

// ✅ ROTA CORRIGIDA E NO LUGAR CERTO: Acessível por qualquer cliente logado
// Busca os planos de boleto disponíveis para o carrinho atual
router.get('/boleto-planos-carrinho', [verifyToken], pedidosController.getBoletoPlansForCart);

// Busca os detalhes de um pedido específico
router.get('/:id', [verifyToken], pedidosController.getPedidoDetalhes);

// Permite que um cliente cancele um pedido que ainda está em processamento
router.patch('/:id/cancelar', [verifyToken], pedidosController.cancelarPedido);


// --- ROTAS EXCLUSIVAS PARA ADMIN ---

// Busca TODOS os pedidos para o painel do admin
router.get('/admin/todos', [verifyToken, isAdmin], pedidosController.getTodosPedidosAdmin);

// Cria um pedido a partir da tela de "Venda Física"
router.post('/admin/venda-fisica', [verifyToken, isAdmin], pedidosController.criarVendaFisica);

// Atualiza o status de um pedido
router.patch('/:id/status', [verifyToken, isAdmin], pedidosController.updateStatusPedido);

// Admin cancela um pedido (com motivo)
router.patch('/admin/:id/cancelar', [verifyToken, isAdmin], pedidosController.cancelarPedidoAdmin);

// Admin edita a quantidade de um item em um pedido existente
router.patch('/itens/:itemId', [verifyToken, isAdmin], pedidosController.updateItemPedido);

// Admin adiciona um pagamento parcial a um pedido "Fiado"
router.post('/:id/pagamento-fiado', [verifyToken, isAdmin], pedidosController.adicionarPagamentoFiado);


module.exports = router;