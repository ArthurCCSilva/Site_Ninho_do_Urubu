const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ✅ Unificamos os imports do middleware e do multer
const { verifyToken, isOwnerOrAdmin } = require('../middleware/authMiddleware'); 
const upload = require('../config/multerConfig'); 

// ✅ Rota de registro mantida com o middleware de upload
router.post('/register', upload.single('imagem_perfil'), authController.register);

// Rota de login
router.post('/login', authController.login);

// ✅ ESSA É A NOVA ROTA QUE ADICIONAMOS
// Retorna os dados completos do usuário autenticado
router.get('/me', verifyToken, authController.getMe);

// ✅ Rota para atualizar a imagem de perfil foi mantida
router.put(
  '/:id/imagem',
  [verifyToken, isOwnerOrAdmin, upload.single('imagem_perfil')],
  authController.updateProfileImage
);

module.exports = router;