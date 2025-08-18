// /routes/produtosRoutes.js

const express = require('express');
const router = express.Router();

// Importamos o controller que contém toda a lógica
const produtosController = require('../controllers/produtosController');

// Importamos os middlewares que fazem a proteção das rotas
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

/*
 * =========================================
 * ROTAS PÚBLICAS
 * (Qualquer usuário ou visitante pode acessar)
 * =========================================
 */

// Rota para LISTAR TODOS os produtos
// GET -> http://localhost:3001/api/produtos/
router.get('/', produtosController.getAllProdutos);

// Rota para PESQUISAR produtos por um termo
// GET -> http://localhost:3001/api/produtos/pesquisar?q=camiseta
// IMPORTANTE: Esta rota deve vir ANTES da rota /:id para não haver conflito.
router.get('/pesquisar', produtosController.pesquisarProduto);

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
// A requisição só chega em 'createProduto' se passar por 'verifyToken' e 'isAdmin'
router.post('/', [verifyToken, isAdmin], produtosController.createProduto);

// Rota para ATUALIZAR um produto existente
// PUT -> http://localhost:3001/api/produtos/123
router.put('/:id', [verifyToken, isAdmin], produtosController.updateProduto);

// Rota para DELETAR um produto
// DELETE -> http://localhost:3001/api/produtos/123
router.delete('/:id', [verifyToken, isAdmin], produtosController.deleteProduto);


module.exports = router;