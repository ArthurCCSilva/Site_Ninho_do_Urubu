// backend/controllers/despesasController.js
const db = require('../db');

exports.adicionarDespesa = async (req, res) => {
  const { descricao, valor, data, categoria } = req.body;
  if (!descricao || !valor || !data) {
    return res.status(400).json({ message: 'Descrição, valor e data são obrigatórios.' });
  }
  try {
    await db.query(
      'INSERT INTO despesas (descricao, valor, data, categoria) VALUES (?, ?, ?, ?)',
      [descricao, valor, data, categoria || null]
    );
    res.status(201).json({ message: 'Despesa adicionada com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar despesa.', error: error.message });
  }
};