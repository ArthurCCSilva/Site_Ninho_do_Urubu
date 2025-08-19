// /middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware 1: Apenas verifica se o token é válido
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  try {
    // A mágica acontece aqui: jwt.verify decodifica e valida o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adiciona os dados do usuário (id, role) à requisição
    next(); // Passa para o próximo middleware ou para o controller final
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido ou expirado.' });
  }
};

// Middleware 2: Verifica se o usuário é Admin (DEVE ser usado DEPOIS do verifyToken)
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
  }
  next();
};

// /middleware/authMiddleware.js

// ... sua função verifyToken e isAdmin ...

// NOVO MIDDLEWARE: Verifica se o usuário é o dono do perfil ou um admin
exports.isOwnerOrAdmin = (req, res, next) => {
  // req.user.id vem do token (usuário logado)
  // req.params.id vem da URL (perfil que está sendo alterado)
  // Usamos parseInt pois o id da URL vem como string
  if (req.user.id === parseInt(req.params.id) || req.user.role === 'admin') {
    next(); // Permissão concedida, pode continuar
  } else {
    return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para alterar este perfil.' });
  }
};