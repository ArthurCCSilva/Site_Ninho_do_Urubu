// backend/routes/funcoesRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/funcoesController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Aplica middleware a todas as rotas deste arquivo
router.use(verifyToken, isAdmin);

// GET /api/funcoes -> Busca todas as funções
router.get('/', ctrl.getAll);

// POST /api/funcoes -> Cria uma nova função
router.post('/', ctrl.create);

// ✅ CORREÇÃO: Rota atualizada para PUT /api/funcoes/:id e chama a função 'update'
router.put('/:id', ctrl.update);

// ✅ CORREÇÃO: Rota atualizada para usar o parâmetro ':id'
router.delete('/:id', ctrl.delete);

// GET /api/funcoes/permissoes -> Busca a lista de todas as permissões
router.get('/permissoes', ctrl.getAllPermissoes);

module.exports = router;