// /controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');// Importa nossa conexão com o banco

// --- REGISTRO ---
exports.register = async (req, res) => {
  try {
    const { nome, email, senha, telefone } = req.body;

    //parte da imagem
    let imagem_perfil_url = null; //Declaramos a variável com um valor padrão 'null'
    if (req.file) {
      // 2. Se um arquivo existir, atualizamos o valor da variável
      imagem_perfil_url = req.file.filename;
    }
    //fim da parte imagem

    // 1. Validação simples
    if (!nome || !email || !senha || !telefone) {
      return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    // 2. Criptografar a senha
    const senhaHash = await bcrypt.hash(senha, 10); // O 10 é o "salt rounds"

    // 3. Salvar no banco de dados
    // Por padrão, todo novo registro é um 'cliente'
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash, role, telefone, imagem_perfil_url) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, email, senhaHash, 'cliente', telefone, imagem_perfil_url]
    );

    res.status(201).json({ message: 'Usuário criado com Sucesso!', userId: result.insertId });
  } catch (error) {
    //erro do email duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado.' })
    }

    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// --- LOGIN ---

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    //1.buscar usuario melo email
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const usuario = rows[0];

    if (!usuario) {
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }

    //2. Comparar a senha enviada com a senha criptografada
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ message: ' Email ou senha inválidos.' });
    }

    //# gerar o Tokent JWT
    // O token contém os dados que queremos que ele carregue (payload)
    // ✅ --- CORREÇÃO AQUI --- ✅
    // Adicionamos mais informações ao payload do token
    const payload = {
      id: usuario.id,
      role: usuario.role,
      nome: usuario.nome,
      email: usuario.email,
      imagem_perfil_url: usuario.imagem_perfil_url,
    };

    const token = jwt.sign(
      payload,                  // Use o novo payload completo
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({ message: 'login bem-sucedido!', token: token });

  } catch (error) {
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
