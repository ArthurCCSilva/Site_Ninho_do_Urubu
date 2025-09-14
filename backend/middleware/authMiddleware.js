//backend/middlewere/authMiddlewere.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Adiciona os dados do usuário (id, role, etc. contidos no token) à requisição
        next(); // Passa para o próximo middleware ou para o controller final
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido ou expirado.' });
    }
};

// Middleware 2: Verifica se o usuário é Admin (DEVE ser usado DEPOIS do verifyToken)
// ✅ ATUALIZADO: Agora busca a role do token decodificado, não do banco.
// Assumimos que a role (admin, dev, cliente) JÁ ESTÁ NO PAYLOAD DO JWT.
exports.isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'dev')) { // Supondo que 'role' é um campo no seu token JWT
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
    }
};

// Middleware para verificar se o usuário é Dev
// ✅ ATUALIZADO: Busca a role do token decodificado.
exports.isDev = (req, res, next) => {
    if (req.user && req.user.role === 'dev') { // Supondo que 'role' é um campo no seu token JWT
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas para desenvolvedores.' });
    }
};

// Middleware para verificar se o usuário é Admin ou Dev
// ✅ ATUALIZADO: Busca a role do token decodificado.
// Este middleware será usado para getAllUsers e deleteUser.
exports.isAdminOrDev = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'dev')) { // Supondo que 'role' é um campo no seu token JWT
        next();
    } else {
        return res.status(403).json({ message: "Acesso negado: Requer função de Administrador ou Desenvolvedor." });
    }
};

// Middleware para verificar se o usuário é o próprio dono do recurso OU Admin OU Dev
// ✅ ATUALIZADO: Usa ID do token e ID da URL, e a role do token.
exports.isOwnerOrAdminOrDev = (req, res, next) => {
    const resourceId = parseInt(req.params.id); // Converte para número, já que IDs MySQL são geralmente numéricos
    const userIdFromToken = req.user.id; // ID do usuário logado (do token)
    const userRoleFromToken = req.user.role; // Role do usuário logado (do token)

    if (!userIdFromToken) {
        return res.status(401).json({ message: "Não autorizado: Usuário não autenticado." });
    }

    // Se o usuário logado é o mesmo que o recurso OU é admin/dev
    if (userIdFromToken === resourceId || userRoleFromToken === 'admin' || userRoleFromToken === 'dev') {
        next();
    } else {
        return res.status(403).json({ message: "Acesso negado: Requer ser o próprio usuário, Administrador ou Desenvolvedor." });
    }
};

// Middleware para verificar se o usuário é o próprio dono do recurso OU Admin
// ✅ ATUALIZADO: Usa ID do token e ID da URL, e a role do token.
exports.isOwnerOrAdmin = (req, res, next) => {
    const resourceId = parseInt(req.params.id); // Converte para número
    const userIdFromToken = req.user.id; // ID do usuário logado (do token)
    const userRoleFromToken = req.user.role; // Role do usuário logado (do token)

    if (!userIdFromToken) {
        return res.status(401).json({ message: "Não autorizado: Usuário não autenticado." });
    }

    // Se o usuário logado é o mesmo que o recurso OU é admin
    if (userIdFromToken === resourceId || userRoleFromToken === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para alterar este perfil.' });
    }
};