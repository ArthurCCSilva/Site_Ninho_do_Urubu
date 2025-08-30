// backend/controllers/rendasExtrasController.js
const db = require('../db');

exports.getRendasExtras = async (req, res) => {
  try {
    const { data_inicio, data_fim, search, page = 1, limit = 10 } = req.query;
    if (!data_inicio || !data_fim) { return res.status(400).json({ message: 'Datas são obrigatórias.' }); }
    let params = [data_inicio, data_fim];
    let whereConditions = 'data BETWEEN ? AND ?';
    if (search) {
      whereConditions += ' AND descricao LIKE ?';
      params.push(`%${search}%`);
    }
    const countSql = `SELECT COUNT(id) as total FROM rendas_extras WHERE ${whereConditions}`;
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const finalParams = [...params, parseInt(limit), parseInt(offset)];
    const sql = `SELECT * FROM rendas_extras WHERE ${whereConditions} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const [rendas] = await db.query(sql, finalParams);
    res.status(200).json({ rendas, totalPages, currentPage: parseInt(page) });
  } catch (error) { res.status(500).json({ message: 'Erro ao buscar rendas extras.', error: error.message }); }
};

exports.adicionarRendaExtra = async (req, res) => {
  const { descricao, valor, data } = req.body;
  if (descricao === undefined || valor === undefined || data === undefined) { 
    return res.status(400).json({ message: 'Descrição, valor e data são obrigatórios.' }); 
  }
  try {
    // ✅ CORREÇÃO: Converte o valor de texto para número antes de salvar
    const valorNumerico = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(valorNumerico)) {
      throw new Error('O valor fornecido é inválido.');
    }
    
    await db.query('INSERT INTO rendas_extras (descricao, valor, data) VALUES (?, ?, ?)', [descricao, valorNumerico, data]);
    res.status(201).json({ message: 'Renda extra adicionada com sucesso!' });
  } catch (error) { 
    res.status(500).json({ message: 'Erro ao adicionar renda extra.', error: error.message }); 
  }
};