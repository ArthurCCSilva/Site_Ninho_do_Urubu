// backend/routes/despesaCategoriasRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/despesaCategoriasController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
router.use(verifyToken, isAdmin);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.delete('/:id', ctrl.delete);
module.exports = router;