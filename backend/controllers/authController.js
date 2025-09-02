// /controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');// Importa nossa conexão com o banco

// --- REGISTRO ---
exports.register = async (req, res) => {
  try {
    const { nome, email, senha, telefone, cpf} = req.body;
    let imagem_perfil_url = req.file ? req.file.filename : null;

    // ✅ 1. VALIDAÇÃO ATUALIZADA: O email não é mais obrigatório
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
      // A mensagem de erro agora precisa ser mais genérica
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

    let emailParaBusca = null;
    let telefoneParaBusca = null;

    // ✅ 1. Verifica se o identificador parece ser um email
    if (identificador.includes('@')) {
      emailParaBusca = identificador;
    } else {
      // Se não for um email, trata como um telefone
      // Limpa todos os caracteres não numéricos
      let telefoneSanitizado = identificador.replace(/\D/g, '');

      // ✅ 2. Lógica "inteligente" para números brasileiros
      // Se o número tiver 10 ou 11 dígitos (DDD + Número) E NÃO começar com 55...
      if ((telefoneSanitizado.length === 10 || telefoneSanitizado.length === 11) && !telefoneSanitizado.startsWith('55')) {
        // ...adiciona o código do Brasil '55' no início.
        telefoneSanitizado = '55' + telefoneSanitizado;
      }
      telefoneParaBusca = telefoneSanitizado;
    }

    // ✅ 3. Executa a busca no banco com os valores preparados
    const sql = 'SELECT * FROM usuarios WHERE email = ? OR telefone = ?';
    const [rows] = await db.query(sql, [emailParaBusca, telefoneParaBusca]);
    const usuario = rows[0];

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // O resto da função continua igual...
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const payload = {
      id: usuario.id,
      role: usuario.role,
      nome: usuario.nome,
      email: usuario.email,
      imagem_perfil_url: usuario.imagem_perfil_url,
    };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({ message: 'Login bem-sucedido!', token: token });

  } catch (error) {
    console.error("Erro no login do backend:", error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// --- NOVA FUNÇÃO AQUI ---
exports.updateProfileImage = async (req, res) => {
  try {
    const { id } = req.params; // ID do usuário a ser atualizado
    const imagem_perfil_url = req.file ? req.file.filename : null; // Nome do arquivo salvo pelo multer

    // Verifica se um arquivo foi realmente enviado
    if (!imagem_perfil_url) {
      return res.status(400).json({ message: 'Nenhuma imagem foi enviada.' });
    }

    // Atualiza o banco de dados com o nome do novo arquivo de imagem
    const [result] = await db.query(
      'UPDATE usuarios SET imagem_perfil_url = ? WHERE id = ?',
      [imagem_perfil_url, id]
    );

    // Verifica se o usuário com o ID fornecido realmente existe
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Imagem de perfil atualizada com sucesso!', imageUrl: imagem_perfil_url });

  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor ao atualizar a imagem.', error: error.message });
  }
};
