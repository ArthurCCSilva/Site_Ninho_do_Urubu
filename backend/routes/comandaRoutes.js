// backend/routes/comandaRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/comandaController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin);

router.get('/', ctrl.getAllAbertas);
router.post('/', ctrl.criarComanda);
router.get('/:id', ctrl.getDetalhesComanda);
router.post('/item', ctrl.adicionarItem);
router.put('/item/:itemId', ctrl.updateItemQuantidade);
router.delete('/item/:itemId', ctrl.removerItem);
router.post('/:comandaId/fechar', ctrl.fecharComanda);

module.exports = router;