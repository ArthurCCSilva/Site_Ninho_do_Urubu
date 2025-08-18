// /controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');// Importa nossa conexão com o banco

// --- REGISTRO ---
exports.register = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // 1. Validação simples
    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    // 2. Criptografar a senha
    const senhaHash = await bcrypt.hash(senha, 10); // O 10 é o "salt rounds"

    // 3. Salvar no banco de dados
    // Por padrão, todo novo registro é um 'cliente'
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)',
      [nome, email, senhaHash, 'cliente']
    );

    res.status(201).json({message: 'Usuário criado com Sucesso!', userId:result.insertId});
  } catch (error) {
    //erro do email duplicado
    if(error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Este e-mail já está cadastrado.'})
    }

    res.status(500).json({ message: 'Erro no servidor', error: error.message});
  }
};

// --- LOGIN ---

exports.login = async (req, res) =>{
    try{
        const {email, senha} = req.body;

        //1.buscar usuario melo email
        const[rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        const usuario = rows[0];

        if(!usuario){
            return res.status(401).json({ message: 'Email ou senha inválidos.'});
        }

        //2. Comparar a senha enviada com a senha criptografada
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if(!senhaValida){
            return res.status(401).json({ message: ' Email ou senha inválidos.'});
        }

        //# gerar o Tokent JWT
        // O token contém os dados que queremos que ele carregue (payload)
        const token = jwt.sign(
            {id: usuario.id, role: usuario.role}, // Payload
            process.env.JWT_SECRET,               // Segredo
            {expiresIn: '8h'}                     // Opções (expira em 8 horas)
        );

        res.status(200).json({ message: 'login bem-sucedido!', token: token});

    } catch (error){
        res.status(500).json({ message: 'Erro no servidor', error: error.message});
    }
};