// backend/routes/rendasExtrasRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rendasExtrasController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
router.use(verifyToken, isAdmin);
router.get('/', ctrl.getRendasExtras);
router.post('/', ctrl.adicionarRendaExtra);
module.exports = router;