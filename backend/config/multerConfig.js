// config/multerConfig.js
const multer = require('multer');
const path = require('path');

// Configuração de armazenamento
const storage = multer.diskStorage({
  // Onde os arquivos serão salvos
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Salva os arquivos na pasta 'uploads'
  },
  // Como os arquivos serão nomeados para evitar conflitos
  filename: function (req, file, cb) {
    // Cria um nome de arquivo único: timestamp + extensão original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de arquivo para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
    cb(null, true); // Aceita o arquivo
  } else {
    cb(new Error('Formato de imagem inválido! Apenas JPEG, PNG e GIF são permitidos.'), false); // Rejeita o arquivo
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limite de 5MB por arquivo
  }
});

module.exports = upload;