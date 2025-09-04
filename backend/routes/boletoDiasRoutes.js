// backend/routes/boletoDiasRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/boletoDiasController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// ✅ CORREÇÃO: A rota GET agora só precisa que o usuário esteja logado.
// Removemos o 'isAdmin' desta linha.
router.get('/', [verifyToken], ctrl.getAll);

// As rotas de adicionar e deletar continuam apenas para admin.
router.post('/', [verifyToken, isAdmin], ctrl.add);
router.delete('/:id', [verifyToken, isAdmin], ctrl.delete);

module.exports = router;