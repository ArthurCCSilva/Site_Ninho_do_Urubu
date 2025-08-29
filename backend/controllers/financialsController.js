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

// ✅ NOVA FUNÇÃO: Calcula a lucratividade por cliente
exports.getCustomerProfitability = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas são obrigatórias.' });
    }

    const sql = `
      SELECT 
        u.id, 
        u.nome, 
        SUM(pi.quantidade * pi.preco_unitario) as receita_total,
        SUM(pi.quantidade * pi.custo_unitario) as custo_total,
        (SUM(pi.quantidade * pi.preco_unitario) - SUM(pi.quantidade * pi.custo_unitario)) as lucro_total
      FROM pedidos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN pedido_itens pi ON p.id = pi.pedido_id
      WHERE p.status = 'Entregue' AND p.data_pedido BETWEEN ? AND ?
      GROUP BY u.id, u.nome
      ORDER BY lucro_total DESC
      LIMIT 10; 
    `;
    
    const [clientes] = await db.query(sql, [data_inicio, data_fim]);
    res.status(200).json(clientes);

  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar lucratividade por cliente.', error: error.message });
  }
};

// ✅ NOVA FUNÇÃO: Calcula a lucratividade por produto
exports.getProductProfitability = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas são obrigatórias.' });
    }

    const sql = `
      SELECT 
        prod.id, 
        prod.nome,
        SUM(pi.quantidade) as quantidade_vendida,
        SUM(pi.quantidade * pi.preco_unitario) as receita_total,
        SUM(pi.quantidade * pi.custo_unitario) as custo_total,
        (SUM(pi.quantidade * pi.preco_unitario) - SUM(pi.quantidade * pi.custo_unitario)) as lucro_total
      FROM produtos prod
      JOIN pedido_itens pi ON prod.id = pi.produto_id
      JOIN pedidos p ON pi.pedido_id = p.id
      WHERE p.status = 'Entregue' AND p.data_pedido BETWEEN ? AND ?
      GROUP BY prod.id, prod.nome
      ORDER BY lucro_total DESC
      LIMIT 10;
    `;
    
    const [produtos] = await db.query(sql, [data_inicio, data_fim]);
    res.status(200).json(produtos);

  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar lucratividade por produto.', error: error.message });
  }
};

exports.getPaymentMethodStats = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas são obrigatórias.' });
    }

    // Query complexa que agrupa por forma de pagamento e calcula os totais
    const sql = `
      SELECT 
        p.forma_pagamento,
        COUNT(p.id) as numero_de_vendas,
        SUM(p.valor_total) as receita_total,
        SUM(pi.quantidade * pi.custo_unitario) as custo_total,
        (SUM(p.valor_total) - SUM(pi.quantidade * pi.custo_unitario)) as lucro_total
      FROM pedidos p
      JOIN pedido_itens pi ON p.id = pi.pedido_id
      WHERE p.status IN ('Entregue', 'Enviado', 'Processando') 
      AND p.data_pedido BETWEEN ? AND ?
      GROUP BY p.forma_pagamento
      ORDER BY lucro_total DESC;
    `;
    
    const [stats] = await db.query(sql, [data_inicio, data_fim]);
    res.status(200).json(stats);

  } catch (error) {
    console.error("Erro ao buscar estatísticas de pagamento:", error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas de pagamento.', error: error.message });
  }
};

exports.getAvailableMonths = async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT 
        YEAR(data_pedido) as ano, 
        MONTH(data_pedido) as mes 
      FROM pedidos 
      WHERE status = 'Entregue' 
      ORDER BY ano DESC, mes DESC
    `;
    const [rows] = await db.query(sql);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar meses disponíveis.', error: error.message });
  }
};

// ✅ NOVA FUNÇÃO: Busca os dados para o gráfico de comparação
exports.getMonthlyComparison = async (req, res) => {
  try {
    const { meses, metrica } = req.query;
    if (!meses || !metrica) {
      return res.status(400).json({ message: 'Meses e métrica são obrigatórios.' });
    }

    const mesesArray = meses.split(',');
    const results = [];

    for (const mesAno of mesesArray) {
      const [ano, mes] = mesAno.split('-');
      let valor = 0;

      if (metrica === 'receitaBruta') {
        const [rows] = await db.query("SELECT SUM(valor_total) as total FROM pedidos WHERE status = 'Entregue' AND YEAR(data_pedido) = ? AND MONTH(data_pedido) = ?", [ano, mes]);
        valor = rows[0].total || 0;
      } else if (metrica === 'custoProdutos') {
        const [rows] = await db.query("SELECT SUM(pi.custo_unitario * pi.quantidade) as total FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status = 'Entregue' AND YEAR(p.data_pedido) = ? AND MONTH(p.data_pedido) = ?", [ano, mes]);
        valor = rows[0].total || 0;
      } else if (metrica === 'despesasOperacionais') {
        const [rows] = await db.query("SELECT SUM(valor) as total FROM despesas WHERE YEAR(data) = ? AND MONTH(data) = ?", [ano, mes]);
        valor = rows[0].total || 0;
      } else if (metrica === 'lucroLiquido') {
        // Para o lucro líquido, precisamos calcular as 3 partes
        const [receitaRows] = await db.query("SELECT SUM(valor_total) as total FROM pedidos WHERE status = 'Entregue' AND YEAR(data_pedido) = ? AND MONTH(data_pedido) = ?", [ano, mes]);
        const receitaBruta = receitaRows[0].total || 0;

        const [custoRows] = await db.query("SELECT SUM(pi.custo_unitario * pi.quantidade) as total FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status = 'Entregue' AND YEAR(p.data_pedido) = ? AND MONTH(p.data_pedido) = ?", [ano, mes]);
        const custoProdutos = custoRows[0].total || 0;

        const [despesasRows] = await db.query("SELECT SUM(valor) as total FROM despesas WHERE YEAR(data) = ? AND MONTH(data) = ?", [ano, mes]);
        const despesasOperacionais = despesasRows[0].total || 0;
        
        valor = (receitaBruta - custoProdutos) - despesasOperacionais;
      }
      
      results.push({ mesAno: `${mes}/${ano}`, valor });
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados de comparação mensal.', error: error.message });
  }
};

// ✅ NOVA FUNÇÃO para o gráfico de comparação de vendas de produtos
exports.getProductSalesComparison = async (req, res) => {
  try {
    // 1. Recebe a nova 'metrica' da requisição
    const { productIds, data_inicio, data_fim, groupBy, metrica } = req.query;
    if (!productIds || !data_inicio || !data_fim || !groupBy || !metrica) {
      return res.status(400).json({ message: 'Todos os parâmetros são obrigatórios.' });
    }

    const idsArray = productIds.split(',');
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m-01';

    // 2. Define dinamicamente o que será calculado com base na métrica
    let selectClause = '';
    switch (metrica) {
      case 'unidades':
        selectClause = 'SUM(pi.quantidade) as valor';
        break;
      case 'lucro':
        selectClause = '(SUM(pi.quantidade * pi.preco_unitario) - SUM(pi.quantidade * pi.custo_unitario)) as valor';
        break;
      default: // 'receita' é o padrão
        selectClause = 'SUM(pi.quantidade * pi.preco_unitario) as valor';
    }

    // 3. Monta a query final
    const sql = `
      SELECT 
        pi.produto_id,
        p.nome as produto_nome,
        DATE_FORMAT(ped.data_pedido, ?) as data_agrupada,
        ${selectClause}
      FROM pedido_itens pi
      JOIN pedidos ped ON pi.pedido_id = ped.id
      JOIN produtos p ON pi.produto_id = p.id
      WHERE ped.status = 'Entregue'
      AND ped.data_pedido BETWEEN ? AND ?
      AND pi.produto_id IN (?)
      GROUP BY pi.produto_id, p.nome, data_agrupada
      ORDER BY data_agrupada ASC
    `;
    
    const [rows] = await db.query(sql, [dateFormat, data_inicio, data_fim, idsArray]);

    // 4. Processa os dados (sem alteração)
    const result = {};
    rows.forEach(row => {
      if (!result[row.produto_nome]) {
        result[row.produto_nome] = [];
      }
      result[row.produto_nome].push({
        date: row.data_agrupada,
        valor: row.valor // O nome 'valor' é genérico e funciona para todas as métricas
      });
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar comparação de vendas de produtos:", error);
    res.status(500).json({ message: 'Erro ao buscar dados de comparação.', error: error.message });
  }
};