// backend/routes/produtosRoutes.js
const express = require('express');
const router = express.Router();
const produtosController = require('../controllers/produtosController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');

// --- ROTAS PÚBLICAS ---
router.get('/', produtosController.getAllProdutos);
router.get('/:id', produtosController.getProdutoById);

// --- ROTAS PRIVADAS / PROTEGIDAS (ADMIN) ---
router.post('/', [verifyToken, isAdmin, upload.single('imagem_produto')], produtosController.createProduto);
router.put('/:id', [verifyToken, isAdmin, upload.single('imagem_produto')], produtosController.updateProduto);
router.delete('/:id', [verifyToken, isAdmin], produtosController.deleteProduto);

// --- ROTAS DE GERENCIAMENTO DE ESTOQUE ---
router.patch('/:id/adicionar-estoque', [verifyToken, isAdmin], produtosController.adicionarEstoque);
router.patch('/:id/corrigir-estoque', [verifyToken, isAdmin], produtosController.corrigirEstoque);
router.patch('/:id/baixa-estoque', [verifyToken, isAdmin], produtosController.darBaixaEstoque);
router.post('/:id/desmembrar', [verifyToken, isAdmin], produtosController.desmembrarProduto);

module.exports = router;