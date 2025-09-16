// backend/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
// ✅ Adicionamos 'hasPermission' à lista de imports
const { verifyToken, isAdmin, isAdminOrDev, isOwnerOrAdminOrDev, isOwnerOrAdmin, hasPermission } = require('../middleware/authMiddleware'); 
const upload = require('../config/multerConfig');

router.get('/minhas-comandas', [verifyToken], usuariosController.getMinhasComandas);

// Rota para o usuário logado atualizar seu próprio perfil
router.put('/perfil', [verifyToken, upload.single('imagem_perfil')], usuariosController.updateProfile);

// ✅ CORREÇÃO AQUI: Trocamos 'isAdmin' pelo middleware 'hasPermission'.
// Agora, qualquer usuário (admin ou funcionário) com a permissão 'admin_info_clientes' pode acessar.
router.get('/clientes', [verifyToken, hasPermission('admin_info_clientes')], usuariosController.getAllClientes);

// O Admin atualizar um cliente específico
router.put('/admin/:id', [verifyToken, isAdmin], usuariosController.adminUpdateUsuario);

router.get('/:id/status-financeiro', [verifyToken, isAdmin], usuariosController.getStatusFinanceiro);
router.get('/:id/fiados', [verifyToken, isAdmin], usuariosController.getPedidosFiado);
router.post('/:id/pagar-fiado-total', [verifyToken, isAdmin], usuariosController.pagarFiadoTotal);

// Rota para buscar todos os usuários (usada na página de Gerenciar Funcionários)
router.get('/', [verifyToken, isAdminOrDev], usuariosController.getAllUsers);

// Rota para um admin registrar um novo funcionário
router.post('/register-employee', [verifyToken, isAdmin], usuariosController.registerEmployee);

// Rota para exclusão de usuário/funcionário (Admin ou Dev)
router.delete('/:id', [verifyToken, isAdminOrDev], usuariosController.deleteUser); 

module.exports = router;