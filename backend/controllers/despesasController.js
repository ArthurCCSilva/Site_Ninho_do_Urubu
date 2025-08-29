// backend/controllers/despesasController.js
const db = require('../db');

// GET / - Busca as despesas de um determinado período
exports.getDespesas = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias.' });
    }
    const [despesas] = await db.query(
      `SELECT 
         d.*, 
         dc.nome as categoria_nome,
         p.nome as produto_nome
       FROM despesas d 
       LEFT JOIN despesa_categorias dc ON d.categoria_id = dc.id
       LEFT JOIN produtos p ON d.produto_id = p.id
       WHERE d.data BETWEEN ? AND ? ORDER BY d.data DESC`,
      [data_inicio, data_fim]
    );
    res.status(200).json(despesas);
  } catch (error) {
    console.error("Erro ao buscar despesas:", error);
    res.status(500).json({ message: 'Erro ao buscar despesas.', error: error.message });
  }
};

// POST / - Adiciona uma nova despesa
exports.adicionarDespesa = async (req, res) => {
  const { descricao, valor, data, categoria_id, produto_id, quantidadeBaixa } = req.body;
  const connection = await db.getConnection();

  if (!descricao || !valor || !data) {
    return res.status(400).json({ message: 'Descrição, valor e data são obrigatórios.' });
  }
  
  try {
    await connection.beginTransaction();

    // 1. Insere a despesa
    await connection.query(
      'INSERT INTO despesas (descricao, valor, data, categoria_id, produto_id) VALUES (?, ?, ?, ?, ?)',
      [descricao, valor, data, categoria_id || null, produto_id || null]
    );

    // 2. Se um produto e uma quantidade para baixa foram informados, atualiza o estoque
    if (produto_id && quantidadeBaixa && parseInt(quantidadeBaixa) > 0) {
      const qtd = parseInt(quantidadeBaixa, 10);

      // Busca o produto para garantir que há estoque suficiente
      const [produtos] = await connection.query('SELECT estoque_total, custo_medio_ponderado FROM produtos WHERE id = ? FOR UPDATE', [produto_id]);
      if (produtos.length === 0) throw new Error('Produto associado à baixa de estoque não encontrado.');
      
      const produto = produtos[0];
      if (qtd > produto.estoque_total) throw new Error(`Baixa excede o estoque. Disponível: ${produto.estoque_total}.`);

      // Recalcula o custo total do inventário
      const novoEstoque = produto.estoque_total - qtd;
      const novoCustoTotalInventario = novoEstoque * produto.custo_medio_ponderado;

      // Atualiza o produto
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