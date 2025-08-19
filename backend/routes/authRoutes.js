// /routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authcontroller = require('../controllers/authController');
const { verifyToken, isOwnerOrAdmin } = require('../middleware/authMiddleware'); // <--- IMPORTE o isOwnerOrAdmin
const upload = require('../config/multerConfig'); // <--- IMPORTE o upload

router.post('/register', upload.single('imagem_perfil'), authcontroller.register);//colocado: upload.single('imagem_perfil')
router.post('/login', authcontroller.login);

// --- NOVA ROTA AQUI ---
// Rota para atualizar a imagem de perfil de um usuário
// PUT /api/auth/:id/imagem
router.put(
  '/:id/imagem',
  [verifyToken, isOwnerOrAdmin, upload.single('imagem_perfil')], // <-- Middlewares em ação
  authcontroller.updateProfileImage // <-- Nova função que vamos criar
);

module.exports = router;