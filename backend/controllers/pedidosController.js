// backend/controllers/pedidosController.js
const db = require('../db');

// POST /api/pedidos - Cria um novo pedido a partir do carrinho do usuário
exports.criarPedido = async (req, res) => {
  const usuarioId = req.user.id;
  const { forma_pagamento, local_entrega, valor_pago_cliente } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (!local_entrega || !forma_pagamento) {
      throw new Error('Forma de pagamento e local de entrega são obrigatórios.');
    }

    const [itensCarrinho] = await connection.query(`SELECT ci.produto_id, ci.quantidade, p.nome, p.valor, p.estoque_total, p.custo_medio_ponderado FROM carrinho_itens ci JOIN produtos p ON ci.produto_id = p.id WHERE ci.usuario_id = ?`, [usuarioId]);
    if (itensCarrinho.length === 0) { throw new Error('O carrinho está vazio.'); }

    let valorTotal = 0;
    for (const item of itensCarrinho) {
      if (item.quantidade > item.estoque_total) { throw new Error(`Estoque insuficiente para o produto: ${item.nome}`); }
      valorTotal += item.quantidade * item.valor;
    }

    const [resultadoPedido] = await connection.query(
      'INSERT INTO pedidos (usuario_id, valor_total, forma_pagamento, local_entrega, valor_pago_cliente) VALUES (?, ?, ?, ?, ?)',
      [usuarioId, valorTotal, forma_pagamento, local_entrega, valor_pago_cliente || null]
    );
    const pedidoId = resultadoPedido.insertId;

    for (const item of itensCarrinho) {
      const novoCustoTotalInventario = item.custo_medio_ponderado * (item.estoque_total - item.quantidade);
      await connection.query('INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, custo_unitario) VALUES (?, ?, ?, ?, ?)', [pedidoId, item.produto_id, item.quantidade, item.valor, item.custo_medio_ponderado]);
      await connection.query('UPDATE produtos SET estoque_total = estoque_total - ?, custo_total_inventario = ? WHERE id = ?', [item.quantidade, novoCustoTotalInventario, item.produto_id]);
    }
    
    await connection.query('DELETE FROM carrinho_itens WHERE usuario_id = ?', [usuarioId]);
    await connection.commit();
    res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: `Erro ao criar pedido: ${error.message}` });
  } finally {
    connection.release();
  }
};

// GET /api/pedidos/meus-pedidos - Busca o histórico de pedidos do usuário logado
exports.getPedidosUsuario = async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const [pedidos] = await db.query('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY data_pedido DESC', [usuarioId]);
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedidos.', error: error.message });
  }
};

exports.getPedidoDetalhes = async (req, res) => {
  const { id: pedidoId } = req.params;
  const { id: usuarioId, role: usuarioRole } = req.user;
  try {
    let sqlPedido = 'SELECT * FROM pedidos WHERE id = ?';
    const paramsPedido = [pedidoId];
    if (usuarioRole !== 'admin') {
      sqlPedido += ' AND usuario_id = ?';
      paramsPedido.push(usuarioId);
    }
    const [pedidos] = await db.query(sqlPedido, paramsPedido);
    if (pedidos.length === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado ou acesso negado.' });
    }

    // ✅ CORREÇÃO AQUI: Adicionamos 'pi.id' à seleção da query
    const sqlItens = `
      SELECT pi.id, pi.quantidade, pi.preco_unitario, p.nome, p.imagem_produto_url 
      FROM pedido_itens pi 
      JOIN produtos p ON pi.produto_id = p.id 
      WHERE pi.pedido_id = ?
    `;
    
    const [itens] = await db.query(sqlItens, [pedidoId]);
    const detalhesPedido = { ...pedidos[0], itens: itens };
    res.status(200).json(detalhesPedido);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar detalhes do pedido.', error: error.message });
  }
};

// PATCH /api/pedidos/:id/cancelar - Permite que um cliente cancele um pedido
exports.cancelarPedido = async (req, res) => {
  const { id: pedidoId } = req.params;
  const { id: usuarioId } = req.user;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. Busca os itens do pedido que será cancelado
    const [itensDoPedido] = await connection.query('SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = ?', [pedidoId]);

    // 2. Devolve cada item ao estoque
    for (const item of itensDoPedido) {
      // ✅ CORREÇÃO AQUI: de 'estoque' para 'estoque_total'
      await connection.query(
        'UPDATE produtos SET estoque_total = estoque_total + ? WHERE id = ?',
        [item.quantidade, item.produto_id]
      );
    }

    // 3. Atualiza o status do pedido
    const [result] = await connection.query("UPDATE pedidos SET status = 'Cancelado', cancelado_por = 'cliente' WHERE id = ? AND usuario_id = ? AND status = 'Processando'", [pedidoId, usuarioId]);
    if (result.affectedRows === 0) {
      throw new Error('Pedido não pode ser cancelado.');
    }
    
    await connection.commit();
    res.status(200).json({ message: 'Pedido cancelado com sucesso e itens devolvidos ao estoque.' });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Erro ao cancelar pedido.', error: error.message });
  } finally {
    connection.release();
  }
};

// PATCH /api/pedidos/:id/cancelar-admin - Admin cancela um pedido
exports.cancelarPedidoAdmin = async (req, res) => {
  const { id: pedidoId } = req.params;
  const { motivo } = req.body;
  const connection = await db.getConnection();
  if (!motivo) {
    return res.status(400).json({ message: 'O motivo do cancelamento é obrigatório.' });
  }
  try {
    await connection.beginTransaction();
    
    // 1. Busca o status atual e o telefone
    const [pedidosAtuais] = await connection.query('SELECT status, u.telefone FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?', [pedidoId]);
    if (pedidosAtuais.length === 0) { throw new Error('Pedido não encontrado.'); }
    if (pedidosAtuais[0].status === 'Cancelado') {
      throw new Error('Este pedido já está cancelado.');
    }
    
    // 2. Busca os itens do pedido
    const [itensDoPedido] = await connection.query('SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = ?', [pedidoId]);
    
    // 3. Devolve cada item ao estoque
    for (const item of itensDoPedido) {
      // ✅ CORREÇÃO AQUI: de 'estoque' para 'estoque_total'
      await connection.query(
        'UPDATE produtos SET estoque_total = estoque_total + ? WHERE id = ?', 
        [item.quantidade, item.produto_id]
      );
    }

    // 4. Atualiza o status do pedido
    await connection.query("UPDATE pedidos SET status = 'Cancelado', cancelado_por = 'admin' WHERE id = ?", [pedidoId]);
    
    // Simulação de notificação via WhatsApp
    console.log(`SIMULAÇÃO WHATSAPP para ${pedidosAtuais[0].telefone}: Pedido #${pedidoId} cancelado. Motivo: ${motivo}`);
    await connection.commit();
    res.status(200).json({ message: 'Pedido cancelado e itens devolvidos ao estoque.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: `Erro ao cancelar pedido: ${error.message}` });
  } finally {
    connection.release();
  }
};

// GET /api/pedidos/admin/todos - Busca TODOS os pedidos para o painel do admin
exports.getTodosPedidosAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        let params = [];
        let baseSql = 'FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id';
        let countSql = `SELECT COUNT(p.id) as total ${baseSql}`;
        let sql = `SELECT p.*, u.nome AS cliente_nome, u.imagem_perfil_url AS cliente_imagem_url, u.telefone AS cliente_telefone ${baseSql}`;
        let conditions = [];

        if (search) {
            conditions.push('u.nome LIKE ?');
            params.push(`%${search}%`);
        }
        if (status) {
            conditions.push('p.status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            countSql += whereClause;
            sql += whereClause;
        }
        
        const [countRows] = await db.query(countSql, params);
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);
        sql += ' ORDER BY p.data_pedido DESC LIMIT ? OFFSET ?';
        const offset = (page - 1) * limit;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const [pedidos] = await db.query(sql, finalParams);
        res.status(200).json({ pedidos, totalPages, currentPage: parseInt(page) });
    } catch (error) {
        console.error('Erro ao buscar todos os pedidos:', error);
        res.status(500).json({ message: 'Erro ao buscar todos os pedidos.', error: error.message });
    }
};

// PATCH /api/pedidos/:id/status - Admin atualiza o status de um pedido
exports.updateStatusPedido = async (req, res) => {
    const { id: pedidoId } = req.params;
    const { status: novoStatus } = req.body;
    const connection = await db.getConnection();
    if (!['Processando', 'Enviado', 'Entregue'].includes(novoStatus)) {
        return res.status(400).json({ message: 'Status inválido.' });
    }
    try {
        await connection.beginTransaction();
        const [pedidosAtuais] = await connection.query('SELECT status FROM pedidos WHERE id = ?', [pedidoId]);
        if (pedidosAtuais.length === 0) { throw new Error('Pedido não encontrado.'); }
        const statusAtual = pedidosAtuais[0].status;
        if(statusAtual === novoStatus) {
            await connection.commit();
            return res.status(200).json({ message: 'O pedido já está com este status.' });
        }
        if (statusAtual === 'Cancelado') {
            const [itensDoPedido] = await connection.query('SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = ?', [pedidoId]);
            for (const item of itensDoPedido) {
                const [produto] = await connection.query('SELECT estoque_total FROM produtos WHERE id = ?', [item.produto_id]);
                if (produto[0].estoque_total < item.quantidade) {
                    throw new Error(`Estoque insuficiente para reativar o pedido (produto ID: ${item.produto_id}).`);
                }
            }
            for (const item of itensDoPedido) {
                await connection.query('UPDATE produtos SET estoque_total = estoque_total - ? WHERE id = ?', [item.quantidade, item.produto_id]);
            }
        }
        let sql = 'UPDATE pedidos SET status = ?, cancelado_por = NULL';
        const params = [novoStatus];

        // ✅ LÓGICA ATUALIZADA
        if (novoStatus === 'Entregue') { 
          sql += ', data_entrega = NOW()'; // Define a data de entrega
        } else { 
          sql += ', data_entrega = NULL'; // Limpa a data de entrega para outros status
        }

        sql += ' WHERE id = ?';
        params.push(pedidoId);
        await connection.query(sql, params);
        await connection.commit();
        res.status(200).json({ message: `Status do pedido atualizado para ${novoStatus}.` });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: `Erro ao atualizar status: ${error.message}` });
    } finally {
        connection.release();
    }
};

// --- ✅ FUNÇÃO DE CANCELAMENTO PELO ADMIN CORRIGIDA --- ✅
exports.cancelarPedidoAdmin = async (req, res) => {
    const { id: pedidoId } = req.params;
    const { motivo } = req.body;
    const connection = await db.getConnection();
    if (!motivo) { return res.status(400).json({ message: 'O motivo do cancelamento é obrigatório.' }); }
    try {
        await connection.beginTransaction();
        const [pedidosAtuais] = await connection.query('SELECT status, u.telefone FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?', [pedidoId]);
        if (pedidosAtuais.length === 0) { throw new Error('Pedido não encontrado.'); }
        if (pedidosAtuais[0].status === 'Cancelado') { throw new Error('Este pedido já está cancelado.'); }
        const [itensDoPedido] = await connection.query('SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = ?', [pedidoId]);
        for (const item of itensDoPedido) {
            await connection.query('UPDATE produtos SET estoque_total = estoque_total + ? WHERE id = ?', [item.quantidade, item.produto_id]);
        }

        // ✅ LÓGICA ATUALIZADA: Define status, quem cancelou E limpa a data de entrega
        await connection.query("UPDATE pedidos SET status = 'Cancelado', cancelado_por = 'admin', data_entrega = NULL WHERE id = ?", [pedidoId]);
        
        console.log(`SIMULAÇÃO WHATSAPP para ${pedidosAtuais[0].telefone}: Pedido #${pedidoId} cancelado. Motivo: ${motivo}`);
        await connection.commit();
        res.status(200).json({ message: 'Pedido cancelado e itens devolvidos ao estoque.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: `Erro ao cancelar pedido: ${error.message}` });
    } finally {
        connection.release();
    }
};

exports.criarVendaFisica = async (req, res) => {
  const { itens, usuario_id, forma_pagamento } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (!itens || itens.length === 0) {
      throw new Error('O carrinho local está vazio.');
    }

    let valorTotal = 0;
    // 1. Verifica o estoque e calcula o valor total da venda
    for (const item of itens) {
      // Usa 'estoque_total' para a verificação
      const [produto] = await connection.query('SELECT nome, valor, estoque_total FROM produtos WHERE id = ?', [item.produto_id]);
      if (produto.length === 0) throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
      if (item.quantidade > produto[0].estoque_total) throw new Error(`Estoque insuficiente para o produto ${produto[0].nome}.`);
      valorTotal += item.quantidade * produto[0].valor;
    }
    
    // 2. Cria o pedido na tabela 'pedidos'
    const [resultadoPedido] = await connection.query(
      "INSERT INTO pedidos (usuario_id, valor_total, status, data_entrega, forma_pagamento) VALUES (?, ?, 'Entregue', NOW(), ?)",
      [usuario_id, valorTotal, forma_pagamento]
    );
    const pedidoId = resultadoPedido.insertId;

    // 3. Adiciona os itens em 'pedido_itens' e atualiza o estoque/custo dos produtos
    for (const item of itens) {
      const [produto] = await connection.query('SELECT valor, estoque_total, custo_medio_ponderado FROM produtos WHERE id = ?', [item.produto_id]);
      
      // Adiciona o custo do item no momento da venda
      await connection.query(
        'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, custo_unitario) VALUES (?, ?, ?, ?, ?)',
        [pedidoId, item.produto_id, item.quantidade, produto[0].valor, produto[0].custo_medio_ponderado]
      );
      
      // Recalcula o valor total do inventário e atualiza o estoque
      const novoCustoTotalInventario = produto[0].custo_medio_ponderado * (produto[0].estoque_total - item.quantidade);
      await connection.query(
          'UPDATE produtos SET estoque_total = estoque_total - ?, custo_total_inventario = ? WHERE id = ?',
          [item.quantidade, novoCustoTotalInventario, item.produto_id]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Venda física registrada com sucesso!', pedidoId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: `Erro ao registrar venda física: ${error.message}` });
  } finally {
    connection.release();
  }
};

exports.updateItemPedido = async (req, res) => {
  const { itemId } = req.params; // ID do item específico em pedido_itens
  const { novaQuantidade } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const quantidadeFinal = parseInt(novaQuantidade, 10);
    if (isNaN(quantidadeFinal) || quantidadeFinal < 0) {
      throw new Error('Quantidade inválida.');
    }

    // 1. Busca o item atual para saber a quantidade antiga e o ID do produto/pedido
    const [itensAtuais] = await connection.query('SELECT * FROM pedido_itens WHERE id = ? FOR UPDATE', [itemId]);
    if (itensAtuais.length === 0) { throw new Error('Item do pedido не encontrado.'); }
    const item = itensAtuais[0];
    const { quantidade: quantidadeAntiga, produto_id, pedido_id } = item;

    // 2. Calcula a diferença para ajustar o estoque
    const diferencaEstoque = quantidadeAntiga - quantidadeFinal;

    // 3. Atualiza o estoque do produto
    if (diferencaEstoque !== 0) {
      await connection.query(
        'UPDATE produtos SET estoque_total = estoque_total + ? WHERE id = ?',
        [diferencaEstoque, produto_id]
      );
    }
    
    // 4. Atualiza ou deleta o item do pedido
    if (quantidadeFinal > 0) {
      await connection.query('UPDATE pedido_itens SET quantidade = ? WHERE id = ?', [quantidadeFinal, itemId]);
    } else {
      // Se a quantidade for zerada, remove o item do pedido
      await connection.query('DELETE FROM pedido_itens WHERE id = ?', [itemId]);
    }

    // 5. Recalcula o valor_total do pedido principal
    const [totalRows] = await connection.query(
      'SELECT SUM(preco_unitario * quantidade) as novoTotal FROM pedido_itens WHERE pedido_id = ?',
      [pedido_id]
    );
    const novoTotalPedido = totalRows[0].novoTotal || 0;

    // 6. Atualiza a tabela 'pedidos' com o novo valor total
    await connection.query('UPDATE pedidos SET valor_total = ? WHERE id = ?', [novoTotalPedido, pedido_id]);
    
    await connection.commit();
    res.status(200).json({ message: 'Item do pedido atualizado com sucesso!' });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: `Erro ao atualizar item do pedido: ${error.message}` });
  } finally {
    connection.release();
  }
};