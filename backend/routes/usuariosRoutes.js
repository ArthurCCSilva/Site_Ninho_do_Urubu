// backend/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');

// Rota para o usuário logado atualizar seu próprio perfil
router.put('/perfil', [verifyToken, upload.single('imagem_perfil')], usuariosController.updateProfile);

module.exports = router;