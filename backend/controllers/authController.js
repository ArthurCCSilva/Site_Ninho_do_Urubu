// /controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// --- REGISTRO ---
// (Mantivemos a sua versão mais nova e completa)
exports.register = async (req, res) => {
  try {
    const { nome, email, senha, telefone, cpf} = req.body;
    let imagem_perfil_url = req.file ? req.file.filename : null;

    if (!nome || !senha || !telefone) {
      return res.status(400).json({ message: 'Nome, senha e telefone são obrigatórios.' });
    }

    const telefoneSanitizado = telefone.replace(/\D/g, '');
    const cpfSanitizado = cpf ? cpf.replace(/\D/g, '') : null;
    const senhaHash = await bcrypt.hash(senha, 10);
    const emailParaSalvar = email || null;

    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash, role, telefone, cpf, imagem_perfil_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nome, emailParaSalvar, senhaHash, 'cliente', telefoneSanitizado, cpfSanitizado, imagem_perfil_url]
    );

    res.status(201).json({ message: 'Usuário criado com Sucesso!', userId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Este e-mail, telefone ou CPF já está cadastrado.' })
    }
    console.error("Erro no registro:", error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// --- LOGIN ---
exports.login = async (req, res) => {
  try {
    const { identificador, senha } = req.body;

    const isEmail = identificador.includes('@');
    const emailParaBusca = isEmail ? identificador : null;
    const telefoneParaBusca = !isEmail ? `%${identificador.replace(/\D/g, '')}` : null;
    
    const sql = `
        SELECT id, nome, email, senha_hash, role, is_active 
        FROM usuarios 
        WHERE email = ? OR telefone LIKE ?
    `;
    const [rows] = await db.query(sql, [emailParaBusca, telefoneParaBusca]);
    const usuario = rows[0];

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    
    if (usuario.is_active === 0) {
        return res.status(403).json({ message: 'Usuário inativo. Contate o administrador.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // ✅ PAYLOAD DO TOKEN SIMPLIFICADO (como no código antigo)
    // Apenas com as informações essenciais para o redirecionamento inicial.
    const payload = {
      id: usuario.id,
      role: usuario.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.status(200).json({ message: 'Login bem-sucedido!', token: token });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};


// --- GETME ---
// Função que busca os dados completos do usuário após o login.
// Essencial para o novo sistema de permissões.
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id; // Vem do token, via middleware

    const [userRows] = await db.query('SELECT id, nome, email, cpf, role, funcao_id, telefone, imagem_perfil_url FROM usuarios WHERE id = ?', [userId]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const userData = userRows[0];
    let permissoesArray = [];
    
    if (userData.role === 'dev' || userData.role === 'admin') {
      const [allPermissions] = await db.query("SELECT GROUP_CONCAT(chave_permissao) as permissoes FROM permissoes");
      if (allPermissions[0].permissoes) {
        permissoesArray = allPermissions[0].permissoes.split(',');
      }
    } else if (userData.role === 'funcionario' && userData.funcao_id) {
      const query = `
        SELECT GROUP_CONCAT(p.chave_permissao) as permissoes
        FROM funcao_permissoes fp
        JOIN permissoes p ON fp.permissao_id = p.id
        WHERE fp.funcao_id = ?
      `;
      const [funcaoRows] = await db.query(query, [userData.funcao_id]);
      if (funcaoRows[0] && funcaoRows[0].permissoes) {
        permissoesArray = funcaoRows[0].permissoes.split(',');
      }
    }

    // ✅ MONTA O OBJETO HÍBRIDO E SIMPLIFICADO
    const userProfile = {
      id: userData.id,
      nomeCompleto: userData.nome,
      usuario: userData.email, // Frontend usa 'usuario' para o campo de email
      cpf: userData.cpf,
      role: userData.role,
      permissoes: permissoesArray,
      telefone: userData.telefone,
      imagem_perfil_url: userData.imagem_perfil_url
    };

    res.status(200).json(userProfile);

  } catch (error) {
    console.error("Erro na função getMe:", error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// --- UPDATE PROFILE IMAGE ---
// (Mantivemos a sua versão mais nova)
exports.updateProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    const imagem_perfil_url = req.file ? req.file.filename : null;

    if (!imagem_perfil_url) {
      return res.status(400).json({ message: 'Nenhuma imagem foi enviada.' });
    }

    const [result] = await db.query(
      'UPDATE usuarios SET imagem_perfil_url = ? WHERE id = ?',
      [imagem_perfil_url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Imagem de perfil atualizada com sucesso!', imageUrl: imagem_perfil_url });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor ao atualizar a imagem.', error: error.message });
  }
};