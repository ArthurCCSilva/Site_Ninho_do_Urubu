// backend/routes/categoriasRoutes.js
const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');
// ✅ Importamos o middleware 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// ✅ ROTA PÚBLICA: Permite que qualquer um veja as categorias.
// Esta linha permanece sem alterações.
router.get('/', categoriasController.getAllCategorias);

// ✅ ROTAS PROTEGIDAS: Apenas usuários com a permissão correta podem gerenciar.
router.post('/', [verifyToken, hasPermission('admin_gerenciar_categorias')], categoriasController.createCategoria);
router.put('/:id', [verifyToken, hasPermission('admin_gerenciar_categorias')], categoriasController.updateCategoria);
router.delete('/:id', [verifyToken, hasPermission('admin_gerenciar_categorias')], categoriasController.deleteCategoria);

module.exports = router;