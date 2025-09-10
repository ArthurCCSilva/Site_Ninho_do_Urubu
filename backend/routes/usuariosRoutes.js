// backend/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');

// Rota para o usuário logado atualizar seu próprio perfil
router.put('/perfil', [verifyToken, upload.single('imagem_perfil')], usuariosController.updateProfile);

// Rota para o admin buscar a lista de todos os clientes
router.get('/clientes', [verifyToken, isAdmin], usuariosController.getAllClientes);

// O Admin atualizar um cliente específico
router.put('/admin/:id', [verifyToken, isAdmin], usuariosController.adminUpdateUsuario);

router.get('/:id/status-financeiro', [verifyToken, isAdmin], usuariosController.getStatusFinanceiro);
router.get('/:id/fiados', [verifyToken, isAdmin], usuariosController.getPedidosFiado);
router.post('/:id/pagar-fiado-total', [verifyToken, isAdmin], usuariosController.pagarFiadoTotal);

module.exports = router;