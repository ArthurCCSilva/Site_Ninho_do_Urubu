// backend/routes/boletosRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/boletosController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Protege todas as rotas deste arquivo, garantindo que apenas administradores logados possam acessá-las.
router.use(verifyToken, isAdmin);

// GET /api/boletos/pendentes-aprovacao -> Busca os pedidos aguardando aprovação
router.get('/pendentes-aprovacao', ctrl.getBoletosParaAprovacao);

// GET /api/boletos/carnes-em-aberto -> Busca os carnês com parcelas em aberto
router.get('/carnes-em-aberto', ctrl.getCarnesEmAberto);

// ✅ ROTA QUE FALTAVA: para buscar os boletos que foram negados
router.get('/negados', ctrl.getBoletosNegados);

router.post('/parcelas/marcar-pagas', ctrl.marcarMultiplasParcelasPagas);

// PATCH /api/boletos/parcela/:id/marcar-paga -> Marca uma parcela específica como paga
router.patch('/parcela/:id/marcar-paga', ctrl.marcarParcelaPaga);

// PATCH /api/boletos/parcela/:id/atualizar-vencimento -> Atualiza a data de vencimento de uma parcela
router.patch('/parcela/:id/atualizar-vencimento', ctrl.updateDataVencimento);

module.exports = router;