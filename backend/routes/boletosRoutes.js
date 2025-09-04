// backend/routes/boletosRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/boletosController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
router.use(verifyToken, isAdmin);
router.get('/pendentes-aprovacao', ctrl.getBoletosParaAprovacao);
router.get('/parcelas-em-aberto', ctrl.getParcelasEmAberto);
router.patch('/parcela/:id/marcar-paga', ctrl.marcarParcelaPaga);
module.exports = router;