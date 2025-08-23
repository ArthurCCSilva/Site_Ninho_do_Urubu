// backend/routes/carrinhoRoutes.js
const express = require('express');
const router = express.Router();
const carrinhoController = require('../controllers/carrinhoController');
const { verifyToken } = require('../middleware/authMiddleware');

// Aplica o middleware de verificação de token para TODAS as rotas deste arquivo
router.use(verifyToken);

router.get('/', carrinhoController.getItensCarrinho);
router.post('/', carrinhoController.adicionarItemCarrinho);
router.delete('/:produtoId', carrinhoController.removerItemCarrinho);

module.exports = router;