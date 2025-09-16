// backend/routes/boletoPlanosRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/boletoPlanosController');
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

router.get('/produto/:produtoId', [verifyToken, hasPermission('sistema_boleto')], ctrl.getPlanosPorProduto);
router.post('/', [verifyToken, hasPermission('sistema_boleto')], ctrl.adicionarPlano);
router.delete('/:id', [verifyToken, hasPermission('sistema_boleto')], ctrl.deletarPlano);


module.exports = router;