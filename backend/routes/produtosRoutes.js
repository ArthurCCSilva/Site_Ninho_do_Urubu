// backend/routes/produtosRoutes.js

const express = require('express');
const router = express.Router();

// Importamos o controller que contém toda a lógica
const produtosController = require('../controllers/produtosController');

// Importamos os middlewares que fazem a proteção das rotas
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const upload = require('../config/multerConfig');//integrar multer das imagens

/*
 * =========================================
 * ROTAS PÚBLICAS
 * (Qualquer usuário ou visitante pode acessar)
 * =========================================
 */

// Rota principal para LISTAR TODOS os produtos (agora também lida com busca, filtro e ordenação)
// GET -> http://localhost:3001/api/produtos/
router.get('/', produtosController.getAllProdutos);

// A rota '/pesquisar' foi removida, pois sua funcionalidade foi integrada à rota '/' acima.

// Rota para buscar UM ÚNICO produto pelo seu ID
// GET -> http://localhost:3001/api/produtos/123
router.get('/:id', produtosController.getProdutoById);


/*
 * =========================================
 * ROTAS PRIVADAS / PROTEGIDAS
 * (Apenas administradores logados podem acessar)
 * =========================================
 */

// Rota para CRIAR um novo produto
// POST -> http://localhost:3001/api/produtos/
router.post('/', [verifyToken, isAdmin, upload.single('imagem_produto')], produtosController.createProduto);

// Rota para ATUALIZAR um produto existente
// PUT -> http://localhost:3001/api/produtos/123
router.put('/:id', [verifyToken, isAdmin, upload.single('imagem_produto')], produtosController.updateProduto);

// Rota para DELETAR um produto
// DELETE -> http://localhost:3001/api/produtos/123
router.delete('/:id', [verifyToken, isAdmin], produtosController.deleteProduto); // Vírgula extra removida daqui

// ✅ NOVA ROTA para adicionar estoque
// PATCH -> http://localhost:3001/api/produtos/123/adicionar-estoque
router.patch('/:id/adicionar-estoque', [verifyToken, isAdmin], produtosController.adicionarEstoque);

module.exports = router;