// backend/routes/produtosRoutes.js
const express = require('express');
const router = express.Router();
const produtosController = require('../controllers/produtosController');
// ✅ Importamos o middleware 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');

// --- ROTAS PÚBLICAS ---
// Estas rotas não mudam.
router.get('/', produtosController.getAllProdutos);
router.get('/:id', produtosController.getProdutoById);


// --- ROTAS PRIVADAS / PROTEGIDAS (ADMIN E FUNCIONÁRIOS COM PERMISSÃO) ---

// ✅ As rotas abaixo foram atualizadas para usar 'hasPermission'.
// A permissão 'admin_gerenciar_produtos' é usada para todas as ações de gerenciamento.
router.get('/inativos', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.getInactiveProdutos);

router.post('/', [verifyToken, hasPermission('admin_gerenciar_produtos'), upload.single('imagem_produto')], produtosController.createProduto);
router.put('/:id', [verifyToken, hasPermission('admin_gerenciar_produtos'), upload.single('imagem_produto')], produtosController.updateProduto);
router.delete('/:id', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.deleteProduto);
router.patch('/:id/reativar', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.reactivateProduto);

// --- ROTAS DE GERENCIAMENTO DE ESTOQUE ---
router.patch('/:id/adicionar-estoque', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.adicionarEstoque);
router.patch('/:id/corrigir-estoque', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.corrigirEstoque);
router.patch('/:id/baixa-estoque', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.darBaixaEstoque);
router.post('/:id/desmembrar', [verifyToken, hasPermission('admin_gerenciar_produtos')], produtosController.desmembrarProduto);

module.exports = router;