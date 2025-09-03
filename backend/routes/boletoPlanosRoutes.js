// backend/routes/boletoPlanosRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/boletoPlanosController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin);

router.get('/produto/:produtoId', ctrl.getPlanosPorProduto);
router.post('/', ctrl.adicionarPlano);
router.delete('/:id', ctrl.deletarPlano);

module.exports = router;