// backend/routes/funcoesRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/funcoesController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:funcaoId/permissoes', ctrl.updatePermissions);
router.delete('/:funcaoId', ctrl.delete);
router.get('/permissoes', ctrl.getAllPermissoes);

module.exports = router;