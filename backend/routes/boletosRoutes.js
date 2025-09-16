// backend/routes/boletosRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/boletosController');
// ✅ Importamos o middleware 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// ❌ A regra geral 'router.use()' foi removida.

// ✅ Cada rota agora é protegida pela permissão 'sistema_boleto',
// permitindo que funcionários autorizados acessem.

router.get('/pendentes-aprovacao', [verifyToken, hasPermission('sistema_boleto')], ctrl.getBoletosParaAprovacao);

router.get('/carnes-em-aberto', [verifyToken, hasPermission('sistema_boleto')], ctrl.getCarnesEmAberto);

router.get('/negados', [verifyToken, hasPermission('sistema_boleto')], ctrl.getBoletosNegados);

router.get('/pagos', [verifyToken, hasPermission('sistema_boleto')], ctrl.getBoletosPagos);

router.post('/parcelas/marcar-pagas', [verifyToken, hasPermission('sistema_boleto')], ctrl.marcarMultiplasParcelasPagas);

router.patch('/parcela/:id/marcar-paga', [verifyToken, hasPermission('sistema_boleto')], ctrl.marcarParcelaPaga);

router.patch('/parcela/:id/atualizar-vencimento', [verifyToken, hasPermission('sistema_boleto')], ctrl.updateDataVencimento);

module.exports = router;