// backend/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verifyToken, isAdmin, isAdminOrDev, isOwnerOrAdminOrDev, isOwnerOrAdmin } = require('../middleware/authMiddleware'); 
const upload = require('../config/multerConfig');

router.get('/minhas-comandas', [verifyToken], usuariosController.getMinhasComandas);

// Rota para o usuário logado atualizar seu próprio perfil
router.put('/perfil', [verifyToken, upload.single('imagem_perfil')], usuariosController.updateProfile);

// Rota para o admin buscar a lista de todos os clientes
router.get('/clientes', [verifyToken, isAdmin], usuariosController.getAllClientes);

// O Admin atualizar um cliente específico
router.put('/admin/:id', [verifyToken, isAdmin], usuariosController.adminUpdateUsuario);

router.get('/:id/status-financeiro', [verifyToken, isAdmin], usuariosController.getStatusFinanceiro);
router.get('/:id/fiados', [verifyToken, isAdmin], usuariosController.getPedidosFiado);
router.post('/:id/pagar-fiado-total', [verifyToken, isAdmin], usuariosController.pagarFiadoTotal);

// ✅ ADIÇÃO DA ROTA: Esta rota atenderá a '/api/usuarios' (que é o que o frontend irá chamar).
router.get('/', [verifyToken, isAdminOrDev], usuariosController.getAllUsers);

// ✅ ADIÇÃO DA ROTA: Para exclusão de usuário/funcionário (Admin ou Dev)
// Use esta para o botão "Excluir" no frontend.
router.delete('/:id', [verifyToken, isAdminOrDev], usuariosController.deleteUser); 

module.exports = router;