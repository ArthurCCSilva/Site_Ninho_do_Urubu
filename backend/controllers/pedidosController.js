// backend/controllers/pedidosController.js
const db = require('../db');

// POST /api/pedidos - Cria um novo pedido a partir do carrinho do usuário
exports.criarPedido = async (req, res) => {
  const usuarioId = req.user.id;
  const { forma_pagamento, local_entrega } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    if (!local_entrega || !forma_pagamento) { throw new Error('Forma de pagamento e local de entrega são obrigatórios.'); }
    const [itensCarrinho] = await connection.query(`SELECT ci.produto_id, ci.quantidade, p.nome, p.valor, p.estoque FROM carrinho_itens ci JOIN produtos p ON ci.produto_id = p.id WHERE ci.usuario_id = ?`, [usuarioId]);
    if (itensCarrinho.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'O carrinho está vazio.' });
    }
    let valorTotal = 0;
    for (const item of itensCarrinho) {
      if (item.quantidade > item.estoque) { throw new Error(`Estoque insuficiente para o produto: ${item.nome}`); }
      valorTotal += item.quantidade * item.valor;
    }
    const [resultadoPedido] = await connection.query('INSERT INTO pedidos (usuario_id, valor_total, forma_pagamento, local_entrega) VALUES (?, ?, ?, ?)', [usuarioId, valorTotal, forma_pagamento, local_entrega]);
    const pedidoId = resultadoPedido.insertId;
    for (const item of itensCarrinho) {
      await connection.query('INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)', [pedidoId, item.produto_id, item.quantidade, item.valor]);
      await connection.query('UPDATE produtos SET estoque = estoque - ? WHERE id = ?', [item.quantidade, item.produto_id]);
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
    const sqlItens = `SELECT pi.quantidade, pi.preco_unitario, p.nome, p.imagem_produto_url FROM pedido_itens pi JOIN produtos p ON pi.produto_id = p.id WHERE pi.pedido_id = ?`;
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
    const [itensDoPedido] = await connection.query('SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = ?', [pedidoId]);
    for (const item of itensDoPedido) {
      await connection.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [item.quantidade, item.produto_id]);
    }
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
                const [produto] = await connection.query('SELECT estoque FROM produtos WHERE id = ?', [item.produto_id]);
                if (produto[0].estoque < item.quantidade) {
                    throw new Error(`Estoque insuficiente para reativar o pedido (produto ID: ${item.produto_id}).`);
                }
            }
            for (const item of itensDoPedido) {
                await connection.query('UPDATE produtos SET estoque = estoque - ? WHERE id = ?', [item.quantidade, item.produto_id]);
            }
        }
        let sql = 'UPDATE pedidos SET status = ?, cancelado_por = NULL';
        const params = [novoStatus];
        if (novoStatus === 'Entregue') { sql += ', data_entrega = NOW()'; } 
        else { sql += ', data_entrega = NULL'; }
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
        const [pedidosAtuais] = await connection.query('SELECT status, u.telefone FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?', [pedidoId]);
        if (pedidosAtuais.length === 0) { throw new Error('Pedido não encontrado.'); }
        if (pedidosAtuais[0].status === 'Cancelado') {
            throw new Error('Este pedido já está cancelado.');
        }
        const [itensDoPedido] = await connection.query('SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = ?', [pedidoId]);
        for (const item of itensDoPedido) {
            await connection.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [item.quantidade, item.produto_id]);
        }
        await connection.query("UPDATE pedidos SET status = 'Cancelado', cancelado_por = 'admin' WHERE id = ?", [pedidoId]);
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
  // O corpo da requisição enviará os itens e o ID do cliente 'Venda Balcão'
  const { itens, usuario_id } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    if (!itens || itens.length === 0) {
      return res.status(400).json({ message: 'O carrinho local está vazio.' });
    }

    // Calcula o valor total e verifica o estoque
    let valorTotal = 0;
    for (const item of itens) {
      const [produto] = await connection.query('SELECT valor, estoque FROM produtos WHERE id = ?', [item.produto_id]);
      if (produto.length === 0) throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
      if (item.quantidade > produto[0].estoque) throw new Error(`Estoque insuficiente para o produto ID: ${item.produto_id}.`);
      
      valorTotal += item.quantidade * produto[0].valor;
    }

    // Cria o pedido já com o status 'Entregue'
    const [resultadoPedido] = await connection.query(
      "INSERT INTO pedidos (usuario_id, valor_total, status, data_entrega) VALUES (?, ?, 'Entregue', NOW())",
      [usuario_id, valorTotal]
    );
    const pedidoId = resultadoPedido.insertId;

    // Adiciona os itens ao pedido e atualiza o estoque
    for (const item of itens) {
      const [produto] = await connection.query('SELECT valor FROM produtos WHERE id = ?', [item.produto_id]);
      await connection.query(
        'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
        [pedidoId, item.produto_id, item.quantidade, produto[0].valor]
      );
      await connection.query(
        'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
        [item.quantidade, item.produto_id]
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