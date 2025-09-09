// backend/controllers/financialsController.js
const db = require('../db');

exports.getSummary = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas são obrigatórias.' });
    }

    // ✅ 1. RECEITA BRUTA - REGIME DE CAIXA CORRIGIDO
    // Vendas normais contam pela DATA DE ENTREGA
    const [receitaPedidosNormais] = await db.query(
      `SELECT SUM(valor_total) as total FROM pedidos 
       WHERE status = 'Entregue' AND forma_pagamento NOT IN ('Boleto Virtual', 'Fiado') 
       AND data_entrega BETWEEN ? AND ?`,
      [data_inicio, data_fim]
    );
    // Fiado conta pela DATA DO PAGAMENTO e ignora pedidos cancelados
    const [receitaFiado] = await db.query(
      `SELECT SUM(pf.valor_pago) as total FROM pagamentos_fiado pf
       JOIN pedidos p ON pf.pedido_id = p.id
       WHERE p.status NOT IN ('Cancelado', 'Boleto Negado') AND pf.data_pagamento BETWEEN ? AND ?`,
      [data_inicio, data_fim]
    );
    // Boleto conta pela DATA DO PAGAMENTO e ignora pedidos cancelados
    const [receitaBoleto] = await db.query(
      `SELECT SUM(bp.valor) as total FROM boleto_parcelas bp
       JOIN boleto_pedidos bped ON bp.boleto_pedido_id = bped.id
       JOIN pedidos p ON bped.pedido_id = p.id
       WHERE bp.status = 'pago' AND p.status NOT IN ('Cancelado', 'Boleto Negado') AND bp.data_pagamento BETWEEN ? AND ?`,
      [data_inicio, data_fim]
    );
    const receitaBruta = (parseFloat(receitaPedidosNormais[0].total) || 0) + (parseFloat(receitaFiado[0].total) || 0) + (parseFloat(receitaBoleto[0].total) || 0);

    // ✅ 2. CUSTO DOS PRODUTOS - Ignora pedidos cancelados
    const [custoRows] = await db.query(
      `SELECT SUM(pi.custo_unitario * pi.quantidade) as custoProdutos 
       FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id 
       WHERE p.status IN ('Entregue', 'Fiado', 'Boleto em Pagamento') AND p.data_pedido BETWEEN ? AND ?`,
      [data_inicio, data_fim]
    );
    const custoProdutos = parseFloat(custoRows[0].custoProdutos) || 0;

    // ... (Despesas e Rendas Extras continuam iguais)
    const [despesasRows] = await db.query("SELECT SUM(valor) as despesas FROM despesas WHERE data BETWEEN ? AND ?", [data_inicio, data_fim]);
    const [rendasRows] = await db.query("SELECT SUM(valor) as rendas FROM rendas_extras WHERE data BETWEEN ? AND ?", [data_inicio, data_fim]);
    const despesasOperacionais = parseFloat(despesasRows[0].despesas) || 0;
    const totalRendasExtras = parseFloat(rendasRows[0].rendas) || 0;
    
    const lucroBruto = receitaBruta - custoProdutos;
    const lucroLiquido = lucroBruto - despesasOperacionais + totalRendasExtras;

    res.status(200).json({ receitaBruta, custoProdutos, despesasOperacionais, totalRendasExtras, lucroBruto, lucroLiquido });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar resumo financeiro.', error: error.message });
  }
};

exports.getSalesOverTime = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim) { return res.status(400).json({ message: 'Datas são obrigatórias.' }); }

    // ✅ CORREÇÕES APLICADAS AQUI TAMBÉM
    const [receitaDiariaEntregue] = await db.query(`SELECT DATE(data_entrega) as dia, SUM(valor_total) as total FROM pedidos WHERE status = 'Entregue' AND forma_pagamento NOT IN ('Boleto Virtual', 'Fiado') AND data_entrega BETWEEN ? AND ? GROUP BY DATE(data_entrega)`, [data_inicio, data_fim]);
    const [receitaDiariaFiado] = await db.query(`SELECT DATE(pf.data_pagamento) as dia, SUM(pf.valor_pago) as total FROM pagamentos_fiado pf JOIN pedidos p ON pf.pedido_id = p.id WHERE p.status NOT IN ('Cancelado', 'Boleto Negado') AND pf.data_pagamento BETWEEN ? AND ? GROUP BY DATE(pf.data_pagamento)`, [data_inicio, data_fim]);
    const [receitaDiariaBoleto] = await db.query(`SELECT DATE(bp.data_pagamento) as dia, SUM(bp.valor) as total FROM boleto_parcelas bp JOIN boleto_pedidos bped ON bp.boleto_pedido_id = bped.id JOIN pedidos p ON bped.pedido_id = p.id WHERE bp.status = 'pago' AND p.status NOT IN ('Cancelado', 'Boleto Negado') AND bp.data_pagamento BETWEEN ? AND ? GROUP BY DATE(bp.data_pagamento)`, [data_inicio, data_fim]);
    const [custoDiario] = await db.query(`SELECT DATE(p.data_pedido) as dia, SUM(pi.custo_unitario * pi.quantidade) as total FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status IN ('Entregue', 'Fiado', 'Boleto em Pagamento') AND p.data_pedido BETWEEN ? AND ? GROUP BY DATE(p.data_pedido)`, [data_inicio, data_fim]);
    const [despesasDiarias] = await db.query(`SELECT data as dia, SUM(valor) as total FROM despesas WHERE data BETWEEN ? AND ? GROUP BY data`, [data_inicio, data_fim]);
    const [rendasExtrasDiarias] = await db.query(`SELECT data as dia, SUM(valor) as total FROM rendas_extras WHERE data BETWEEN ? AND ? GROUP BY data`, [data_inicio, data_fim]);
    
    const resultados = {};
    const preencherResultados = (rows, campo) => {
      rows.forEach(row => {
        if (!row.dia) return;
        const dia = new Date(row.dia).toISOString().split('T')[0];
        if (!resultados[dia]) {
          resultados[dia] = { dia, receitaBruta: 0, custoProdutos: 0, despesas: 0, rendasExtras: 0 };
        }
        if (campo === 'receitaBruta') {
            resultados[dia][campo] += parseFloat(row.total) || 0;
        } else {
            resultados[dia][campo] = parseFloat(row.total) || 0;
        }
      });
    };
    
    preencherResultados(receitaDiariaEntregue, 'receitaBruta');
    preencherResultados(receitaDiariaFiado, 'receitaBruta');
    preencherResultados(receitaDiariaBoleto, 'receitaBruta');
    preencherResultados(custoDiario, 'custoProdutos');
    preencherResultados(despesasDiarias, 'despesas');
    preencherResultados(rendasExtrasDiarias, 'rendasExtras');

    const dadosFinais = Object.values(resultados).map(r => {
      const lucroLiquido = r.receitaBruta - r.custoProdutos - r.despesas + r.rendasExtras;
      return { ...r, lucroLiquido, receitaBruta: r.receitaBruta };
    }).sort((a, b) => new Date(a.dia) - new Date(b.dia));

    res.status(200).json(dadosFinais);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados de vendas ao longo do tempo.', error: error.message });
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
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Datas são obrigatórias.' });
    }

    const stats = {};

    // 1. Contagem de Vendas por forma de pagamento final
    const [vendasRows] = await db.query(
      `SELECT 
        CASE 
          WHEN p.status = 'Entregue' AND p.forma_pagamento_original IS NOT NULL THEN p.forma_pagamento_original
          ELSE p.forma_pagamento 
        END as f_pagamento,
        COUNT(p.id) as vendas
      FROM pedidos p
      WHERE p.status IN ('Entregue', 'Fiado', 'Boleto em Pagamento') AND p.data_pedido BETWEEN ? AND ?
      GROUP BY f_pagamento`,
      [data_inicio, data_fim]
    );
    vendasRows.forEach(row => {
      if (!stats[row.f_pagamento]) stats[row.f_pagamento] = { vendas: 0, receita: 0, custo: 0 };
      stats[row.f_pagamento].vendas += row.vendas;
    });

    // 2. Receita de Vendas Normais ('Entregue')
    const [receitaNormalRows] = await db.query(
      `SELECT forma_pagamento as f_pagamento, SUM(valor_total) as receita 
       FROM pedidos 
       WHERE status = 'Entregue' AND forma_pagamento NOT IN ('Boleto Virtual', 'Fiado') 
       AND data_entrega BETWEEN ? AND ? 
       GROUP BY f_pagamento`,
      [data_inicio, data_fim]
    );
    receitaNormalRows.forEach(row => {
      if (!stats[row.f_pagamento]) stats[row.f_pagamento] = { vendas: 0, receita: 0, custo: 0 };
      stats[row.f_pagamento].receita += parseFloat(row.receita);
    });

    // 3. Receita de Fiado e Boleto (pagamentos recebidos)
    const [receitaCreditoRows] = await db.query(
      `SELECT 
        CASE
            WHEN p.status = 'Entregue' AND p.forma_pagamento_original IS NOT NULL THEN p.forma_pagamento_original
            ELSE p.forma_pagamento
        END as f_pagamento,
        SUM(sub.valor_pago) as receita
      FROM (
        SELECT pedido_id, valor_pago, data_pagamento FROM pagamentos_fiado
        UNION ALL
        SELECT bped.pedido_id, bp.valor as valor_pago, bp.data_pagamento 
        FROM boleto_parcelas bp 
        JOIN boleto_pedidos bped ON bp.boleto_pedido_id = bped.id
        WHERE bp.status = 'pago'
      ) as sub
      JOIN pedidos p ON sub.pedido_id = p.id
      WHERE p.status NOT IN ('Cancelado', 'Boleto Negado') AND sub.data_pagamento BETWEEN ? AND ?
      GROUP BY f_pagamento`,
      [data_inicio, data_fim]
    );
    receitaCreditoRows.forEach(row => {
      if (!stats[row.f_pagamento]) stats[row.f_pagamento] = { vendas: 0, receita: 0, custo: 0 };
      stats[row.f_pagamento].receita += parseFloat(row.receita);
    });

    // 4. Custo Total por forma de pagamento
    const [custoRows] = await db.query(
      `SELECT 
        CASE 
          WHEN p.status = 'Entregue' AND p.forma_pagamento_original IS NOT NULL THEN p.forma_pagamento_original
          ELSE p.forma_pagamento 
        END as f_pagamento,
        SUM(pi.custo_unitario * pi.quantidade) as custo 
       FROM pedido_itens pi 
       JOIN pedidos p ON pi.pedido_id = p.id 
       WHERE p.status IN ('Entregue', 'Fiado', 'Boleto em Pagamento') AND p.data_pedido BETWEEN ? AND ?
       GROUP BY f_pagamento`,
      [data_inicio, data_fim]
    );
    custoRows.forEach(row => {
      if (!stats[row.f_pagamento]) stats[row.f_pagamento] = { vendas: 0, receita: 0, custo: 0 };
      stats[row.f_pagamento].custo += parseFloat(row.custo);
    });

    // 5. Calcula o lucro e formata para a resposta final
    const finalStats = Object.keys(stats).map(key => {
      const { vendas, receita, custo } = stats[key];
      return {
        forma_pagamento: key,
        numero_de_vendas: vendas,
        receita_total: receita,
        custo_total: custo,
        lucro_total: receita - custo
      };
    }).sort((a, b) => b.receita_total - a.receita_total);

    res.status(200).json(finalStats);
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

      // Lógica de cálculo para CADA métrica, agora usando o Regime de Caixa correto
      if (metrica === 'receitaBruta') {
        const [receitaPedidos] = await db.query(`SELECT SUM(valor_total) as total FROM pedidos WHERE status = 'Entregue' AND forma_pagamento NOT IN ('Boleto Virtual', 'Fiado') AND YEAR(data_entrega) = ? AND MONTH(data_entrega) = ?`, [ano, mes]);
        const [receitaFiado] = await db.query("SELECT SUM(valor_pago) as total FROM pagamentos_fiado pf JOIN pedidos p ON pf.pedido_id = p.id WHERE p.status NOT IN ('Cancelado', 'Boleto Negado') AND YEAR(pf.data_pagamento) = ? AND MONTH(pf.data_pagamento) = ?", [ano, mes]);
        const [receitaBoleto] = await db.query("SELECT SUM(valor) as total FROM boleto_parcelas bp JOIN boleto_pedidos bped ON bp.boleto_pedido_id = bped.id JOIN pedidos p ON bped.pedido_id = p.id WHERE bp.status = 'pago' AND p.status NOT IN ('Cancelado', 'Boleto Negado') AND YEAR(bp.data_pagamento) = ? AND MONTH(bp.data_pagamento) = ?", [ano, mes]);
        valor = (parseFloat(receitaPedidos[0].total) || 0) + (parseFloat(receitaFiado[0].total) || 0) + (parseFloat(receitaBoleto[0].total) || 0);
      
      } else if (metrica === 'custoProdutos') {
        const [custoRows] = await db.query(`SELECT SUM(pi.custo_unitario * pi.quantidade) as total FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status IN ('Entregue', 'Fiado', 'Boleto em Pagamento') AND YEAR(p.data_pedido) = ? AND MONTH(p.data_pedido) = ?`, [ano, mes]);
        valor = parseFloat(custoRows[0].total) || 0;
      
      } else if (metrica === 'despesasOperacionais') {
        const [rows] = await db.query("SELECT SUM(valor) as total FROM despesas WHERE YEAR(data) = ? AND MONTH(data) = ?", [ano, mes]);
        valor = parseFloat(rows[0].total) || 0;
      
      } else if (metrica === 'lucroLiquido') {
        // Recalcula tudo para o mês específico, usando a mesma lógica acima
        const [receitaPedidos] = await db.query(`SELECT SUM(valor_total) as total FROM pedidos WHERE status = 'Entregue' AND forma_pagamento NOT IN ('Boleto Virtual', 'Fiado') AND YEAR(data_entrega) = ? AND MONTH(data_entrega) = ?`, [ano, mes]);
        const [receitaFiado] = await db.query("SELECT SUM(valor_pago) as total FROM pagamentos_fiado pf JOIN pedidos p ON pf.pedido_id = p.id WHERE p.status NOT IN ('Cancelado', 'Boleto Negado') AND YEAR(pf.data_pagamento) = ? AND MONTH(pf.data_pagamento) = ?", [ano, mes]);
        const [receitaBoleto] = await db.query("SELECT SUM(valor) as total FROM boleto_parcelas bp JOIN boleto_pedidos bped ON bp.boleto_pedido_id = bped.id JOIN pedidos p ON bped.pedido_id = p.id WHERE bp.status = 'pago' AND p.status NOT IN ('Cancelado', 'Boleto Negado') AND YEAR(bp.data_pagamento) = ? AND MONTH(bp.data_pagamento) = ?", [ano, mes]);
        const receitaBruta = (parseFloat(receitaPedidos[0].total) || 0) + (parseFloat(receitaFiado[0].total) || 0) + (parseFloat(receitaBoleto[0].total) || 0);
        
        const [custoRows] = await db.query(`SELECT SUM(pi.custo_unitario * pi.quantidade) as total FROM pedido_itens pi JOIN pedidos p ON pi.pedido_id = p.id WHERE p.status IN ('Entregue', 'Fiado', 'Boleto em Pagamento') AND YEAR(p.data_pedido) = ? AND MONTH(p.data_pedido) = ?`, [ano, mes]);
        const custoProdutos = parseFloat(custoRows[0].total) || 0;
        
        const [despesasRows] = await db.query("SELECT SUM(valor) as total FROM despesas WHERE YEAR(data) = ? AND MONTH(data) = ?", [ano, mes]);
        const despesasOperacionais = parseFloat(despesasRows[0].total) || 0;
        
        const [rendasRows] = await db.query("SELECT SUM(valor) as total FROM rendas_extras WHERE YEAR(data) = ? AND MONTH(data) = ?", [ano, mes]);
        const totalRendasExtras = parseFloat(rendasRows[0].total) || 0;
        
        valor = (receitaBruta - custoProdutos) - despesasOperacionais + totalRendasExtras;
      }
      results.push({ mesAno: `${String(mes).padStart(2,'0')}/${ano}`, valor });
    }
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados de comparação mensal.', error: error.message });
  }
};

exports.getProductSalesComparison = async (req, res) => {
  try {
    const { productIds, data_inicio, data_fim, groupBy, metrica } = req.query;
    if (!productIds) return res.status(200).json({});
    
    const idsArray = productIds.split(',');
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m-01';
    
    let sql;
    let params;

    if (metrica === 'receita') {
        sql = `
            SELECT 
                p.nome as produto_nome, 
                DATE_FORMAT(sub.data_pagamento, ?) as data_agrupada, 
                SUM(sub.valor_recebido) as valor_calculado
            FROM (
                -- 1. Receita de Vendas Normais (Entregue, não Fiado/Boleto)
                SELECT 
                    pi.produto_id, 
                    pi.preco_unitario * pi.quantidade as valor_recebido, 
                    ped.data_entrega as data_pagamento
                FROM pedido_itens pi JOIN pedidos ped ON pi.pedido_id = ped.id
                WHERE ped.status = 'Entregue' AND ped.forma_pagamento NOT IN ('Boleto Virtual', 'Fiado') 
                AND ped.data_entrega BETWEEN ? AND ? AND pi.produto_id IN (?)
                
                UNION ALL

                -- 2. Receita de Fiado Pago (distribuída proporcionalmente entre os itens do pedido)
                SELECT 
                    pi.produto_id, 
                    pf.valor_pago * (pi.preco_unitario * pi.quantidade / ped.valor_total) as valor_recebido, 
                    pf.data_pagamento
                FROM pagamentos_fiado pf 
                JOIN pedidos ped ON pf.pedido_id = ped.id 
                JOIN pedido_itens pi ON ped.id = pi.pedido_id
                WHERE ped.status NOT IN ('Cancelado', 'Boleto Negado') AND pf.data_pagamento BETWEEN ? AND ? AND pi.produto_id IN (?)

                UNION ALL

                -- 3. Receita de Boleto Pago (distribuída proporcionalmente entre os itens do pedido)
                SELECT 
                    pi.produto_id, 
                    bp.valor * (pi.preco_unitario * pi.quantidade / ped.valor_total) as valor_recebido, 
                    bp.data_pagamento
                FROM boleto_parcelas bp
                JOIN boleto_pedidos bped ON bp.boleto_pedido_id = bped.id
                JOIN pedidos ped ON bped.pedido_id = ped.id
                JOIN pedido_itens pi ON ped.id = pi.pedido_id
                WHERE bp.status = 'pago' AND ped.status NOT IN ('Cancelado', 'Boleto Negado') AND bp.data_pagamento BETWEEN ? AND ? AND pi.produto_id IN (?)
            ) as sub
            JOIN produtos p ON sub.produto_id = p.id
            WHERE sub.valor_recebido IS NOT NULL
            GROUP BY p.nome, data_agrupada
            ORDER BY data_agrupada ASC;
        `;
        params = [dateFormat, data_inicio, data_fim, idsArray, data_inicio, data_fim, idsArray, data_inicio, data_fim, idsArray];
    } else if (metrica === 'lucro') {
        sql = `
            SELECT 
                p.nome as produto_nome, 
                DATE_FORMAT(sub.data_pagamento, ?) as data_agrupada, 
                SUM(sub.valor_recebido - sub.custo_proporcional) as valor_calculado
            FROM (
                -- Lucro de Vendas Normais
                SELECT 
                    pi.produto_id, 
                    pi.preco_unitario * pi.quantidade as valor_recebido, 
                    pi.custo_unitario * pi.quantidade as custo_proporcional, 
                    ped.data_entrega as data_pagamento
                FROM pedido_itens pi JOIN pedidos ped ON pi.pedido_id = ped.id
                WHERE ped.status = 'Entregue' AND ped.forma_pagamento NOT IN ('Boleto Virtual', 'Fiado') 
                AND ped.data_entrega BETWEEN ? AND ? AND pi.produto_id IN (?)
                
                UNION ALL

                -- Lucro de Fiado Pago
                SELECT 
                    pi.produto_id, 
                    pf.valor_pago as valor_recebido, 
                    (pf.valor_pago / ped.valor_total) * (pi.custo_unitario * pi.quantidade) as custo_proporcional, 
                    pf.data_pagamento
                FROM pagamentos_fiado pf 
                JOIN pedidos ped ON pf.pedido_id = ped.id 
                JOIN pedido_itens pi ON ped.id = pi.pedido_id
                WHERE ped.status NOT IN ('Cancelado', 'Boleto Negado') AND pf.data_pagamento BETWEEN ? AND ? AND pi.produto_id IN (?)

                UNION ALL

                -- Lucro de Boleto Pago
                SELECT 
                    pi.produto_id, 
                    bp.valor as valor_recebido, 
                    (bp.valor / ped.valor_total) * (pi.custo_unitario * pi.quantidade) as custo_proporcional, 
                    bp.data_pagamento
                FROM boleto_parcelas bp
                JOIN boleto_pedidos bped ON bp.boleto_pedido_id = bped.id
                JOIN pedidos ped ON bped.pedido_id = ped.id
                JOIN pedido_itens pi ON ped.id = pi.pedido_id
                WHERE bp.status = 'pago' AND ped.status NOT IN ('Cancelado', 'Boleto Negado') AND bp.data_pagamento BETWEEN ? AND ? AND pi.produto_id IN (?)
            ) as sub
            JOIN produtos p ON sub.produto_id = p.id
            WHERE sub.valor_recebido IS NOT NULL
            GROUP BY p.nome, data_agrupada
            ORDER BY data_agrupada ASC;
        `;
        params = [dateFormat, data_inicio, data_fim, idsArray, data_inicio, data_fim, idsArray, data_inicio, data_fim, idsArray];
    } else { // 'unidades'
        sql = `
            SELECT p.nome as produto_nome, DATE_FORMAT(ped.data_pedido, ?) as data_agrupada, SUM(pi.quantidade) as valor_calculado
            FROM pedido_itens pi
            JOIN produtos p ON pi.produto_id = p.id
            JOIN pedidos ped ON pi.pedido_id = ped.id
            WHERE ped.status IN ('Entregue', 'Fiado', 'Boleto em Pagamento')
            AND ped.data_pedido BETWEEN ? AND ? AND pi.produto_id IN (?)
            GROUP BY p.nome, data_agrupada 
            ORDER BY data_agrupada ASC;
        `;
        params = [dateFormat, data_inicio, data_fim, idsArray];
    }
    
    const [rows] = await db.query(sql, params);
    
    const result = formatDataForChart(rows);
    return res.status(200).json(result);

  } catch (error) {
    console.error("Erro ao buscar comparação de vendas de produtos:", error);
    res.status(500).json({ message: 'Erro ao buscar dados de comparação.', error: error.message });
  }
};

function formatDataForChart(rows) {
    const result = {};
    rows.forEach(row => {
      if (!result[row.produto_nome]) { result[row.produto_nome] = []; }
      result[row.produto_nome].push({ date: row.data_agrupada, valor_calculado: parseFloat(row.valor_calculado) || 0 });
    });
    return result;
}