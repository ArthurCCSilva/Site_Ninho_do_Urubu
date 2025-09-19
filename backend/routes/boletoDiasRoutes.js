// backend/routes/boletoDiasRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/boletoDiasController');
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// ✅ CORREÇÃO: Adicionamos a chave de permissão 'sistema_boleto' em cada rota.
router.get('/', [verifyToken, hasPermission('sistema_boleto')], ctrl.getAll);
router.post('/', [verifyToken, hasPermission('sistema_boleto')], ctrl.add);
router.delete('/:id', [verifyToken, hasPermission('sistema_boleto')], ctrl.delete);

module.exports = router;