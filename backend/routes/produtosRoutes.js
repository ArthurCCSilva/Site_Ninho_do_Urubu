// backend/routes/produtosRoutes.js
const express = require('express');
const router = express.Router();
const produtosController = require('../controllers/produtosController');
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');

// --- ROTAS PÚBLICAS E ESPECÍFICAS ---

// GET para a lista de todos os produtos
router.get('/', produtosController.getAllProdutos);

// ✅ CORREÇÃO: A rota específica '/inativos' agora vem ANTES da rota genérica '/:id'.
router.get('/inativos', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.getInactiveProdutos);

// GET para um produto específico por ID
router.get('/:id', produtosController.getProdutoById);

// --- ROTAS PRIVADAS / PROTEGIDAS ---
router.post('/', [verifyToken, hasPermission('admin_gerenciar_produtos'), upload.single('imagem_produto')], produtosController.createProduto);
router.put('/:id', [verifyToken, hasPermission('admin_gerenciar_produtos'), upload.single('imagem_produto')], produtosController.updateProduto);
router.delete('/:id', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.deleteProduto);
router.patch('/:id/reativar', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.reactivateProduto);
router.patch('/:id/adicionar-estoque', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.adicionarEstoque);
router.patch('/:id/corrigir-estoque', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.corrigirEstoque);
router.patch('/:id/baixa-estoque', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.darBaixaEstoque);
router.post('/:id/desmembrar', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.desmembrarProduto);

module.exports = router;