// backend/routes/featureFlagsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/featureFlagsController');
const { verifyToken, isDev } = require('../middleware/authMiddleware');

// ✅ CORRETO: A rota principal exige que o usuário esteja logado.
router.get('/', [verifyToken], ctrl.getAllPublic);

// Rotas protegidas para o dev.
router.get('/dev', [verifyToken, isDev], ctrl.getAllForDev);
router.patch('/:id', [verifyToken, isDev], ctrl.updateFlag);

module.exports = router;