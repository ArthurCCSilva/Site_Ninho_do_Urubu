// backend/controllers/financialsController.js
const db = require('../db');

exports.getSummary = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias.' });
    }

    // ✅ CORREÇÃO: Busca a receita de pedidos 'Entregue' que NUNCA foram fiado
    const [receitaPedidosNormais] = await db.query(
      `SELECT SUM(valor_total) as total FROM pedidos 
       WHERE status = 'Entregue' AND data_pedido BETWEEN ? AND ?
       AND id NOT IN (SELECT DISTINCT pedido_id FROM pagamentos_fiado)`, 
      [data_inicio, data_fim]
    );
    
    // Busca a receita dos pagamentos de fiado recebidos no período
    const [receitaPagamentosFiado] = await db.query(
      "SELECT SUM(valor_pago) as total FROM pagamentos_fiado WHERE data_pagamento BETWEEN ? AND ?",
      [data_inicio, data_fim]
    );
    
    const receitaBruta = (parseFloat(receitaPedidosNormais[0].total) || 0) + (parseFloat(receitaPagamentosFiado[0].total) || 0);

    const [custoRows] = await db.query(
      `SELECT SUM(pi.custo_unitario * pi.quantidade) as custoProdutos 
       FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id
       WHERE p.status IN ('Entregue', 'Fiado') AND p.data_pedido BETWEEN ? AND ?`,
       [data_inicio, data_fim]
    );
    const custoProdutos = parseFloat(custoRows[0].custoProdutos) || 0;

    const [despesasRows] = await db.query("SELECT SUM(valor) as despesasOperacionais FROM despesas WHERE data BETWEEN ? AND ?", [data_inicio, data_fim]);
    const [rendasRows] = await db.query("SELECT SUM(valor) as totalRendasExtras FROM rendas_extras WHERE data BETWEEN ? AND ?", [data_inicio, data_fim]);
    const despesasOperacionais = parseFloat(despesasRows[0].despesasOperacionais) || 0;
    const totalRendasExtras = parseFloat(rendasRows[0].totalRendasExtras) || 0;

    const lucroBruto = receitaBruta - custoProdutos;
    const lucroLiquido = lucroBruto - despesasOperacionais + totalRendasExtras;

    res.status(200).json({
      receitaBruta, custoProdutos, despesasOperacionais,
      totalRendasExtras, lucroBruto, lucroLiquido
    });
  } catch (error) {
    console.error("Erro ao buscar resumo financeiro:", error);
    res.status(500).json({ message: 'Erro ao buscar resumo financeiro.', error: error.message });
  }
};

exports.getSalesOverTime = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) { return res.status(400).json({ message: 'Datas são obrigatórias.' }); }

    // ✅ CORREÇÃO: Busca receita de pedidos 'Entregue' que NUNCA foram fiado
    const [receitaDiariaEntregue] = await db.query(
        `SELECT DATE(data_pedido) as dia, SUM(valor_total) as total 
         FROM pedidos WHERE status = 'Entregue' AND data_pedido BETWEEN ? AND ?
         AND id NOT IN (SELECT DISTINCT pedido_id FROM pagamentos_fiado)
         GROUP BY DATE(data_pedido)`, 
        [data_inicio, data_fim]
    );
    const [receitaDiariaFiado] = await db.query(`SELECT DATE(data_pagamento) as dia, SUM(valor_pago) as total FROM pagamentos_fiado WHERE data_pagamento BETWEEN ? AND ? GROUP BY DATE(data_pagamento)`, [data_inicio, data_fim]);
    const [custoDiario] = await db.query(`SELECT DATE(p.data_pedido) as dia, SUM(pi.custo_unitario * pi.quantidade) as total FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status IN ('Entregue', 'Fiado') AND p.data_pedido BETWEEN ? AND ? GROUP BY DATE(p.data_pedido)`, [data_inicio, data_fim]);
    const [despesasDiarias] = await db.query(`SELECT data as dia, SUM(valor) as total FROM despesas WHERE data BETWEEN ? AND ? GROUP BY data`, [data_inicio, data_fim]);
    const [rendasExtrasDiarias] = await db.query(`SELECT data as dia, SUM(valor) as total FROM rendas_extras WHERE data BETWEEN ? AND ? GROUP BY data`, [data_inicio, data_fim]);
    
    const resultados = {};
    const preencherResultados = (rows, campo) => {
      rows.forEach(row => {
        const dia = new Date(row.dia).toISOString().split('T')[0];
        if (!resultados[dia]) {
          resultados[dia] = { dia, receitaBruta: 0, custoProdutos: 0, despesas: 0, rendasExtras: 0 };
        }
        if (campo === 'receitaBruta') {
            resultados[dia][campo] += parseFloat(row.total);
        } else {
            resultados[dia][campo] = parseFloat(row.total);
        }
      });
    };
    
    preencherResultados(receitaDiariaEntregue, 'receitaBruta');
    preencherResultados(receitaDiariaFiado, 'receitaBruta');
    preencherResultados(custoDiario, 'custoProdutos');
    preencherResultados(despesasDiarias, 'despesas');
    preencherResultados(rendasExtrasDiarias, 'rendasExtras');

    const dadosFinais = Object.values(resultados).map(r => {
      const lucroLiquido = r.receitaBruta - r.custoProdutos - r.despesas + r.rendasExtras;
      return { ...r, lucroLiquido };
    }).sort((a, b) => new Date(a.dia) - new Date(b.dia));

    res.status(200).json(dadosFinais);
  } catch (error) {
    console.error("Erro ao buscar dados de vendas ao longo do tempo:", error);
    res.status(500).json({ message: 'Erro ao buscar dados de vendas.', error: error.message });
  }
};

exports.getSalesOverTime = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) { return res.status(400).json({ message: 'Datas são obrigatórias.' }); }

    // ✅ LÓGICA ATUALIZADA para refletir o fluxo de caixa
    const [receitaDiariaEntregue] = await db.query(`SELECT DATE(data_pedido) as dia, SUM(valor_total) as total FROM pedidos WHERE status = 'Entregue' AND data_pedido BETWEEN ? AND ? GROUP BY DATE(data_pedido)`, [data_inicio, data_fim]);
    const [receitaDiariaFiado] = await db.query(`SELECT DATE(data_pagamento) as dia, SUM(valor_pago) as total FROM pagamentos_fiado WHERE data_pagamento BETWEEN ? AND ? GROUP BY DATE(data_pagamento)`, [data_inicio, data_fim]);
    const [custoDiario] = await db.query(`SELECT DATE(p.data_pedido) as dia, SUM(pi.custo_unitario * pi.quantidade) as total FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status IN ('Entregue', 'Fiado') AND p.data_pedido BETWEEN ? AND ? GROUP BY DATE(p.data_pedido)`, [data_inicio, data_fim]);
    const [despesasDiarias] = await db.query(`SELECT data as dia, SUM(valor) as total FROM despesas WHERE data BETWEEN ? AND ? GROUP BY data`, [data_inicio, data_fim]);
    const [rendasExtrasDiarias] = await db.query(`SELECT data as dia, SUM(valor) as total FROM rendas_extras WHERE data BETWEEN ? AND ? GROUP BY data`, [data_inicio, data_fim]);
    
    const resultados = {};
    const preencherResultados = (rows, campo) => {
      rows.forEach(row => {
        const dia = new Date(row.dia).toISOString().split('T')[0];
        if (!resultados[dia]) {
          resultados[dia] = { dia, receitaBruta: 0, custoProdutos: 0, despesas: 0, rendasExtras: 0 };
        }
        // Se o campo for receita, somamos ao que já existe (para juntar entregues e fiados no mesmo dia)
        if (campo === 'receitaBruta') {
            resultados[dia][campo] += parseFloat(row.total);
        } else {
            resultados[dia][campo] = parseFloat(row.total);
        }
      });
    };
    
    preencherResultados(receitaDiariaEntregue, 'receitaBruta');
    preencherResultados(receitaDiariaFiado, 'receitaBruta');
    preencherResultados(custoDiario, 'custoProdutos');
    preencherResultados(despesasDiarias, 'despesas');
    preencherResultados(rendasExtrasDiarias, 'rendasExtras');

    const dadosFinais = Object.values(resultados).map(r => {
      const lucroLiquido = r.receitaBruta - r.custoProdutos - r.despesas + r.rendasExtras;
      return { ...r, lucroLiquido };
    }).sort((a, b) => new Date(a.dia) - new Date(b.dia));

    res.status(200).json(dadosFinais);
  } catch (error) {
    console.error("Erro ao buscar dados de vendas ao longo do tempo:", error);
    res.status(500).json({ message: 'Erro ao buscar dados de vendas.', error: error.message });
  }
};

exports.getSalesOverTime = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas são obrigatórias.' });
    }
    const [receitaDiaria] = await db.query(`SELECT DATE(data_pedido) as dia, SUM(valor_total) as total FROM pedidos WHERE status = 'Entregue' AND data_pedido BETWEEN ? AND ? GROUP BY DATE(data_pedido)`, [data_inicio, data_fim]);
    const [custoDiario] = await db.query(`SELECT DATE(p.data_pedido) as dia, SUM(pi.custo_unitario * pi.quantidade) as total FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status = 'Entregue' AND p.data_pedido BETWEEN ? AND ? GROUP BY DATE(p.data_pedido)`, [data_inicio, data_fim]);
    const [despesasDiarias] = await db.query(`SELECT data as dia, SUM(valor) as total FROM despesas WHERE data BETWEEN ? AND ? GROUP BY data`, [data_inicio, data_fim]);
    const [rendasExtrasDiarias] = await db.query(`SELECT data as dia, SUM(valor) as total FROM rendas_extras WHERE data BETWEEN ? AND ? GROUP BY data`, [data_inicio, data_fim]);
    
    const resultados = {};
    const preencherResultados = (rows, campo) => {
      rows.forEach(row => {
        const dia = new Date(row.dia).toISOString().split('T')[0];
        if (!resultados[dia]) {
          resultados[dia] = { dia, receitaBruta: 0, custoProdutos: 0, despesas: 0, rendasExtras: 0 };
        }
        resultados[dia][campo] = parseFloat(row.total);
      });
    };
    
    preencherResultados(receitaDiaria, 'receitaBruta');
    preencherResultados(custoDiario, 'custoProdutos');
    preencherResultados(despesasDiarias, 'despesas');
    preencherResultados(rendasExtrasDiarias, 'rendasExtras');

    const dadosFinais = Object.values(resultados).map(r => {
      const lucroLiquido = r.receitaBruta - r.custoProdutos - r.despesas + r.rendasExtras;
      return { ...r, lucroLiquido };
    }).sort((a, b) => new Date(a.dia) - new Date(b.dia));

    res.status(200).json(dadosFinais);
  } catch (error) {
    console.error("Erro ao buscar dados de vendas ao longo do tempo:", error);
    res.status(500).json({ message: 'Erro ao buscar dados de vendas.', error: error.message });
  }
};

exports.getCustomerProfitability = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) { return res.status(400).json({ message: 'Datas são obrigatórias.' }); }
    const sql = `SELECT u.id, u.nome, SUM(pi.quantidade * pi.preco_unitario) as receita_total, SUM(pi.quantidade * pi.custo_unitario) as custo_total, (SUM(pi.quantidade * pi.preco_unitario) - SUM(pi.quantidade * pi.custo_unitario)) as lucro_total FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id JOIN pedido_itens pi ON p.id = pi.pedido_id WHERE p.status = 'Entregue' AND p.data_pedido BETWEEN ? AND ? GROUP BY u.id, u.nome ORDER BY lucro_total DESC LIMIT 10;`;
    const [clientes] = await db.query(sql, [data_inicio, data_fim]);
    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar lucratividade por cliente.', error: error.message });
  }
};

exports.getProductProfitability = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) { return res.status(400).json({ message: 'Datas são obrigatórias.' }); }
    const sql = `SELECT prod.id, prod.nome, SUM(pi.quantidade) as quantidade_vendida, SUM(pi.quantidade * pi.preco_unitario) as receita_total, SUM(pi.quantidade * pi.custo_unitario) as custo_total, (SUM(pi.quantidade * pi.preco_unitario) - SUM(pi.quantidade * pi.custo_unitario)) as lucro_total FROM produtos prod JOIN pedido_itens pi ON prod.id = pi.produto_id JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status = 'Entregue' AND p.data_pedido BETWEEN ? AND ? GROUP BY prod.id, prod.nome ORDER BY lucro_total DESC LIMIT 10;`;
    const [produtos] = await db.query(sql, [data_inicio, data_fim]);
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar lucratividade por produto.', error: error.message });
  }
};

exports.getPaymentMethodStats = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) { return res.status(400).json({ message: 'Datas são obrigatórias.' }); }
    const sql = `SELECT p.forma_pagamento, COUNT(p.id) as numero_de_vendas, SUM(p.valor_total) as receita_total, SUM(pi.quantidade * pi.custo_unitario) as custo_total, (SUM(p.valor_total) - SUM(pi.quantidade * pi.custo_unitario)) as lucro_total FROM pedidos p JOIN pedido_itens pi ON p.id = pi.pedido_id WHERE p.status IN ('Entregue', 'Enviado', 'Processando') AND p.data_pedido BETWEEN ? AND ? GROUP BY p.forma_pagamento ORDER BY lucro_total DESC;`;
    const [stats] = await db.query(sql, [data_inicio, data_fim]);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas de pagamento:", error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas de pagamento.', error: error.message });
  }
};

exports.getAvailableMonths = async (req, res) => {
  try {
    const sql = `SELECT DISTINCT YEAR(data_pedido) as ano, MONTH(data_pedido) as mes FROM pedidos WHERE status = 'Entregue' ORDER BY ano DESC, mes DESC`;
    const [rows] = await db.query(sql);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar meses disponíveis.', error: error.message });
  }
};

exports.getMonthlyComparison = async (req, res) => {
  try {
    const { meses, metrica } = req.query;
    if (!meses || !metrica) { return res.status(400).json({ message: 'Meses e métrica são obrigatórios.' }); }
    const mesesArray = meses.split(',');
    const results = [];
    for (const mesAno of mesesArray) {
      const [ano, mes] = mesAno.split('-');
      let valor = 0;
      if (metrica === 'receitaBruta') {
        const [rows] = await db.query("SELECT SUM(valor_total) as total FROM pedidos WHERE status = 'Entregue' AND YEAR(data_pedido) = ? AND MONTH(data_pedido) = ?", [ano, mes]);
        valor = parseFloat(rows[0].total) || 0;
      } else if (metrica === 'custoProdutos') {
        const [rows] = await db.query("SELECT SUM(pi.custo_unitario * pi.quantidade) as total FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status = 'Entregue' AND YEAR(p.data_pedido) = ? AND MONTH(p.data_pedido) = ?", [ano, mes]);
        valor = parseFloat(rows[0].total) || 0;
      } else if (metrica === 'despesasOperacionais') {
        const [rows] = await db.query("SELECT SUM(valor) as total FROM despesas WHERE YEAR(data) = ? AND MONTH(data) = ?", [ano, mes]);
        valor = parseFloat(rows[0].total) || 0;
      } else if (metrica === 'lucroLiquido') {
        const [receitaRows] = await db.query("SELECT SUM(valor_total) as total FROM pedidos WHERE status = 'Entregue' AND YEAR(data_pedido) = ? AND MONTH(data_pedido) = ?", [ano, mes]);
        const receitaBruta = parseFloat(receitaRows[0].total) || 0;
        const [custoRows] = await db.query("SELECT SUM(pi.custo_unitario * pi.quantidade) as total FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status = 'Entregue' AND YEAR(p.data_pedido) = ? AND MONTH(p.data_pedido) = ?", [ano, mes]);
        const custoProdutos = parseFloat(custoRows[0].total) || 0;
        const [despesasRows] = await db.query("SELECT SUM(valor) as total FROM despesas WHERE YEAR(data) = ? AND MONTH(data) = ?", [ano, mes]);
        const despesasOperacionais = parseFloat(despesasRows[0].total) || 0;
        const [rendasRows] = await db.query("SELECT SUM(valor) as total FROM rendas_extras WHERE YEAR(data) = ? AND MONTH(data) = ?", [ano, mes]);
        const totalRendasExtras = parseFloat(rendasRows[0].total) || 0;
        valor = (receitaBruta - custoProdutos) - despesasOperacionais + totalRendasExtras;
      }
      results.push({ mesAno: `${mes}/${ano}`, valor });
    }
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados de comparação mensal.', error: error.message });
  }
};

exports.getProductSalesComparison = async (req, res) => {
  try {
    const { productIds, data_inicio, data_fim, groupBy, metrica } = req.query;
    if (!productIds || !data_inicio || !data_fim || !groupBy || !metrica) {
      return res.status(400).json({ message: 'Todos os parâmetros são obrigatórios.' });
    }
    const idsArray = productIds.split(',');
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m-01';
    let selectClause = '';
    switch (metrica) {
      case 'unidades': selectClause = 'SUM(pi.quantidade) as valor'; break;
      case 'lucro': selectClause = '(SUM(pi.quantidade * pi.preco_unitario) - SUM(pi.quantidade * pi.custo_unitario)) as valor'; break;
      default: selectClause = 'SUM(pi.quantidade * pi.preco_unitario) as valor';
    }
    const sql = `SELECT pi.produto_id, p.nome as produto_nome, DATE_FORMAT(ped.data_pedido, ?) as data_agrupada, ${selectClause} FROM pedido_itens pi JOIN pedidos ped ON pi.pedido_id = ped.id JOIN produtos p ON pi.produto_id = p.id WHERE ped.status = 'Entregue' AND ped.data_pedido BETWEEN ? AND ? AND pi.produto_id IN (?) GROUP BY pi.produto_id, p.nome, data_agrupada ORDER BY data_agrupada ASC`;
    const [rows] = await db.query(sql, [dateFormat, data_inicio, data_fim, idsArray]);
    const result = {};
    rows.forEach(row => {
      if (!result[row.produto_nome]) { result[row.produto_nome] = []; }
      result[row.produto_nome].push({ date: row.data_agrupada, valor: parseFloat(row.valor) || 0 });
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar comparação de vendas de produtos:", error);
    res.status(500).json({ message: 'Erro ao buscar dados de comparação.', error: error.message });
  }
};