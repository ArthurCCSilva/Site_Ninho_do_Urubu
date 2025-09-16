//backend/middlewere/authMiddlewere.js
const jwt = require('jsonwebtoken');
const db = require('../db');

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

exports.hasPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id; // ID pego do token pelo 'verifyToken'

      // Busca o usuário e suas permissões ATUAIS no banco de dados
      const [userRows] = await db.query('SELECT role, funcao_id FROM usuarios WHERE id = ?', [userId]);

      if (userRows.length === 0) {
        return res.status(403).json({ message: 'Acesso proibido: usuário não encontrado.' });
      }

      const user = userRows[0];
      let userPermissions = [];

      // Se for dev ou admin, tem todas as permissões
      if (user.role === 'dev' || user.role === 'admin') {
        const [allPermissions] = await db.query("SELECT GROUP_CONCAT(chave_permissao) as permissoes FROM permissoes");
        if (allPermissions[0].permissoes) {
          userPermissions = allPermissions[0].permissoes.split(',');
        }
      } 
      // Se for funcionário, busca as permissões da sua função
      else if (user.role === 'funcionario' && user.funcao_id) {
        const query = `
          SELECT GROUP_CONCAT(p.chave_permissao) as permissoes
          FROM funcao_permissoes fp
          JOIN permissoes p ON fp.permissao_id = p.id
          WHERE fp.funcao_id = ?
        `;
        const [funcaoRows] = await db.query(query, [user.funcao_id]);
        if (funcaoRows[0] && funcaoRows[0].permissoes) {
          userPermissions = funcaoRows[0].permissoes.split(',');
        }
      }

      // A verificação final
      if (userPermissions.includes(requiredPermission)) {
        next(); // Permissão encontrada, pode prosseguir
      } else {
        return res.status(403).json({ message: 'Acesso proibido: permissão insuficiente.' });
      }

    } catch (error) {
      console.error("Erro no middleware hasPermission:", error);
      return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
  };
};