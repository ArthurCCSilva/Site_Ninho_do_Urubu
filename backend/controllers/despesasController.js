// backend/controllers/despesasController.js
const db = require('../db');

exports.getDespesas = async (req, res) => {
  try {
    const { data_inicio, data_fim, search, page = 1, limit = 10 } = req.query;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas são obrigatórias.' });
    }
    let params = [data_inicio, data_fim];
    let whereConditions = 'd.data BETWEEN ? AND ?';
    if (search) {
      whereConditions += ' AND d.descricao LIKE ?';
      params.push(`%${search}%`);
    }
    const countSql = `SELECT COUNT(d.id) as total FROM despesas d WHERE ${whereConditions}`;
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const finalParams = [...params, parseInt(limit), parseInt(offset)];
    const sql = `
      SELECT d.*, dc.nome as categoria_nome, p.nome as produto_nome 
      FROM despesas d 
      LEFT JOIN despesa_categorias dc ON d.categoria_id = dc.id
      LEFT JOIN produtos p ON d.produto_id = p.id
      WHERE ${whereConditions} 
      ORDER BY d.id DESC
      LIMIT ? OFFSET ?
    `;
    const [despesas] = await db.query(sql, finalParams);
    res.status(200).json({ despesas, totalPages, currentPage: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar despesas.', error: error.message });
  }
};

exports.adicionarDespesa = async (req, res) => {
  const { descricao, valor, data, categoria_id, produto_id, quantidadeBaixa } = req.body;
  const connection = await db.getConnection();
  if (!descricao || valor === undefined || !data) {
    return res.status(400).json({ message: 'Descrição, valor e data são obrigatórios.' });
  }
  
  try {
    await connection.beginTransaction();

    // ✅ CORREÇÃO AQUI: Converte o valor para número antes de usar
    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico)) {
      throw new Error('O valor fornecido é inválido.');
    }

    await connection.query(
      'INSERT INTO despesas (descricao, valor, data, categoria_id, produto_id) VALUES (?, ?, ?, ?, ?)',
      [descricao, valorNumerico, data, categoria_id || null, produto_id || null]
    );

    if (produto_id && quantidadeBaixa && parseInt(quantidadeBaixa) > 0) {
      const qtd = parseInt(quantidadeBaixa, 10);
      const [produtos] = await connection.query('SELECT estoque_total, custo_medio_ponderado FROM produtos WHERE id = ? FOR UPDATE', [produto_id]);
      if (produtos.length === 0) throw new Error('Produto associado à baixa de estoque não encontrado.');
      const produto = produtos[0];
      if (qtd > produto.estoque_total) throw new Error(`Baixa excede o estoque. Disponível: ${produto.estoque_total}.`);
      const novoEstoque = produto.estoque_total - qtd;
      const novoCustoTotalInventario = novoEstoque * produto.custo_medio_ponderado;
      await connection.query(
        'UPDATE produtos SET estoque_total = ?, custo_total_inventario = ? WHERE id = ?',
        [novoEstoque, novoCustoTotalInventario, produto_id]
      );
    }
    
    await connection.commit();
    res.status(201).json({ message: 'Despesa adicionada com sucesso!' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: `Erro ao adicionar despesa: ${error.message}` });
  } finally {
    connection.release();
  }
};