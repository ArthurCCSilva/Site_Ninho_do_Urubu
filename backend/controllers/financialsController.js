// backend/controllers/financialsController.js
const db = require('../db');

exports.getSummary = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias.' });
    }

    // 1. Calcula a Receita Bruta (soma do valor total de todos os pedidos)
    const [receitaRows] = await db.query(
      "SELECT SUM(valor_total) as receitaBruta FROM pedidos WHERE status = 'Entregue' AND data_pedido BETWEEN ? AND ?",
      [data_inicio, data_fim]
    );
    const receitaBruta = receitaRows[0].receitaBruta || 0;

    // 2. Calcula o Custo dos Produtos Vendidos (COGS)
    const [custoRows] = await db.query(
      `SELECT SUM(pi.custo_unitario * pi.quantidade) as custoProdutos 
       FROM pedido_itens pi
       JOIN pedidos p ON pi.pedido_id = p.id
       WHERE p.status = 'Entregue' AND p.data_pedido BETWEEN ? AND ?`,
       [data_inicio, data_fim]
    );
    const custoProdutos = custoRows[0].custoProdutos || 0;

    // 3. Calcula as Despesas Operacionais
    const [despesasRows] = await db.query(
      "SELECT SUM(valor) as despesasOperacionais FROM despesas WHERE data BETWEEN ? AND ?",
      [data_inicio, data_fim]
    );
    const despesasOperacionais = despesasRows[0].despesasOperacionais || 0;

    // 4. Calcula o Lucro
    const lucroBruto = receitaBruta - custoProdutos;
    const lucroLiquido = lucroBruto - despesasOperacionais;

    res.status(200).json({
      receitaBruta,
      custoProdutos,
      despesasOperacionais,
      lucroBruto,
      lucroLiquido
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar resumo financeiro.', error: error.message });
  }
};

exports.getSalesOverTime = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias.' });
    }

    // Esta query SQL agrupa os pedidos por dia e soma o valor total de cada dia.
    // DATE() extrai apenas a data (ex: '2025-08-28') do timestamp 'data_pedido'.
    const sql = `
      SELECT 
        DATE(data_pedido) as dia, 
        SUM(valor_total) as totalVendido 
      FROM pedidos 
      WHERE status = 'Entregue' AND data_pedido BETWEEN ? AND ? 
      GROUP BY DATE(data_pedido) 
      ORDER BY dia ASC
    `;
    
    const [salesData] = await db.query(sql, [data_inicio, data_fim]);
    
    res.status(200).json(salesData);

  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados de vendas.', error: error.message });
  }
};