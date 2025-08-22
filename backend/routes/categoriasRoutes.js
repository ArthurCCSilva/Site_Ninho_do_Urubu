// backend/routes/categoriasRoutes.js
const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/', categoriasController.getAllCategorias);
router.post('/', [verifyToken, isAdmin], categoriasController.createCategoria);
router.delete('/:id', [verifyToken, isAdmin], categoriasController.deleteCategoria);

module.exports = router;