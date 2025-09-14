// backend/controllers/funcionariosController.js
const db = require('../db');
const bcrypt = require('bcryptjs');

exports.create = async (req, res) => {
    const { nome, email, senha, funcao_id } = req.body;
    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        await db.query(
            "INSERT INTO usuarios (nome, email, senha_hash, role, funcao_id, is_active) VALUES (?, ?, ?, 'funcionario', ?, TRUE)",
            [nome, email, senhaHash, funcao_id]
        );
        res.status(201).json({ message: 'Funcionário criado com sucesso!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Este email já está em uso.' });
        res.status(500).json({ message: 'Erro ao criar funcionário.' });
    }
};