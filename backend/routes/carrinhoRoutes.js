// backend/routes/carrinhoRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/carrinhoController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protege todas as rotas deste arquivo.
// Apenas usuários logados podem interagir com o carrinho.
router.use(verifyToken);

// --- Rotas do Carrinho ---

// GET /api/carrinho -> Busca todos os itens do carrinho do usuário
router.get('/', ctrl.getItensCarrinho);

// POST /api/carrinho -> Adiciona um novo item ao carrinho
router.post('/', ctrl.adicionarItem);

// PUT /api/carrinho -> Atualiza a quantidade de um item no carrinho
router.put('/', ctrl.updateQuantidadeItem);

// DELETE /api/carrinho/limpar -> Remove TODOS os itens do carrinho
router.delete('/limpar', ctrl.limparCarrinho);

// DELETE /api/carrinho/:produtoId -> Remove um item específico do carrinho
router.delete('/:produtoId', ctrl.removerItem);

module.exports = router;