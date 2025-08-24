// backend/controllers/pedidosController.js
const db = require('../db');

// POST /api/pedidos - Cria um novo pedido a partir do carrinho do usuário
exports.criarPedido = async (req, res) => {
  const usuarioId = req.user.id;
  const connection = await db.getConnection(); // Pega uma conexão para a transação

  try {
    await connection.beginTransaction(); // Inicia a transação

    // 1. Buscar itens e verificar se o carrinho não está vazio
    const [itensCarrinho] = await connection.query(
      `SELECT ci.produto_id, ci.quantidade, p.valor, p.estoque 
       FROM carrinho_itens ci 
       JOIN produtos p ON ci.produto_id = p.id 
       WHERE ci.usuario_id = ?`,
      [usuarioId]
    );

    if (itensCarrinho.length === 0) {
      throw new Error('O carrinho está vazio.');
    }

    // 2. Verificar estoque e calcular o valor total
    let valorTotal = 0;
    for (const item of itensCarrinho) {
      if (item.quantidade > item.estoque) {
        throw new Error(`Estoque insuficiente para o produto ID: ${item.produto_id}`);
      }
      valorTotal += item.quantidade * item.valor;
    }

    // 3. Criar o pedido na tabela 'pedidos'
    const [resultadoPedido] = await connection.query(
      'INSERT INTO pedidos (usuario_id, valor_total) VALUES (?, ?)',
      [usuarioId, valorTotal]
    );
    const pedidoId = resultadoPedido.insertId;

    // 4. Mover itens do carrinho para 'pedido_itens' e atualizar estoque
    for (const item of itensCarrinho) {
      await connection.query(
        'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
        [pedidoId, item.produto_id, item.quantidade, item.valor]
      );
      await connection.query(
        'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
        [item.quantidade, item.produto_id]
      );
    }

    // 5. Limpar o carrinho do usuário
    await connection.query('DELETE FROM carrinho_itens WHERE usuario_id = ?', [usuarioId]);

    await connection.commit(); // Confirma a transação
    res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId });

  } catch (error) {
    await connection.rollback(); // Desfaz tudo se der erro
    res.status(500).json({ message: 'Erro ao criar pedido.', error: error.message });
  } finally {
    connection.release(); // Libera a conexão
  }
};

// GET /api/pedidos/meus-pedidos - Busca o histórico de pedidos do usuário logado
exports.getPedidosUsuario = async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const [pedidos] = await db.query(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY data_pedido DESC',
      [usuarioId]
    );
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedidos.', error: error.message });
  }
};

// ✅ --- NOVA FUNÇÃO ADICIONADA AQUI --- ✅
// GET /api/pedidos/:id - Busca os detalhes de um pedido específico
exports.getPedidoDetalhes = async (req, res) => {
  const { id: pedidoId } = req.params; // Pega o ID do pedido da URL
  const { id: usuarioId, role: usuarioRole } = req.user; // Pega dados do usuário do token

  try {
    // 1. Busca os dados gerais do pedido e verifica a permissão
    let sqlPedido = 'SELECT * FROM pedidos WHERE id = ?';
    const paramsPedido = [pedidoId];

    // Se o usuário não for admin, ele só pode ver o próprio pedido
    if (usuarioRole !== 'admin') {
      sqlPedido += ' AND usuario_id = ?';
      paramsPedido.push(usuarioId);
    }
    
    const [pedidos] = await db.query(sqlPedido, paramsPedido);

    if (pedidos.length === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado ou acesso negado.' });
    }

    // 2. Busca os itens específicos daquele pedido
    const sqlItens = `
      SELECT pi.quantidade, pi.preco_unitario, p.nome, p.imagem_produto_url
      FROM pedido_itens pi
      JOIN produtos p ON pi.produto_id = p.id
      WHERE pi.pedido_id = ?
    `;
    const [itens] = await db.query(sqlItens, [pedidoId]);

    // 3. Monta a resposta final
    const detalhesPedido = {
      ...pedidos[0], // Pega os dados do pedido (id, valor_total, status, etc)
      itens: itens   // Adiciona a lista de itens
    };
    
    res.status(200).json(detalhesPedido);

  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar detalhes do pedido.', error: error.message });
  }
};

// ✅ NOVA FUNÇÃO para o cliente cancelar o próprio pedido
exports.cancelarPedido = async (req, res) => {
  const { id: pedidoId } = req.params;
  const { id: usuarioId } = req.user;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction(); // Inicia a transação

    // 1. Busca os itens do pedido que será cancelado
    const [itensDoPedido] = await connection.query(
      'SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = ?',
      [pedidoId]
    );

    // 2. Devolve cada item ao estoque
    for (const item of itensDoPedido) {
      await connection.query(
        'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
        [item.quantidade, item.produto_id]
      );
    }

    // 3. Atualiza o status do pedido e registra que foi o cliente que cancelou
    const [result] = await connection.query(
      "UPDATE pedidos SET status = 'Cancelado', cancelado_por = 'cliente' WHERE id = ? AND usuario_id = ? AND status = 'Processando'",
      [pedidoId, usuarioId]
    );

    if (result.affectedRows === 0) {
      // Se nenhuma linha foi afetada, o pedido não existe, não é do usuário ou não pode ser cancelado
      throw new Error('Pedido não pode ser cancelado.');
    }
    
    await connection.commit(); // 4. Se tudo deu certo, confirma a transação
    res.status(200).json({ message: 'Pedido cancelado com sucesso e itens devolvidos ao estoque.' });

  } catch (error) {
    await connection.rollback(); // 5. Se algo deu errado, desfaz tudo
    res.status(500).json({ message: 'Erro ao cancelar pedido.', error: error.message });
  } finally {
    connection.release(); // 6. Libera a conexão com o banco
  }
};

// ✅ --- NOVAS FUNÇÕES DE ADMIN --- ✅

// GET /api/pedidos/admin/todos - Busca TODOS os pedidos para o painel do admin
exports.getTodosPedidosAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    let params = [];
    
    // Inicia as queries base, AGORA COM O JOIN EM AMBAS
    let baseSql = 'FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id';
    
    let countSql = `SELECT COUNT(p.id) as total ${baseSql}`;
    let sql = `
      SELECT p.*, u.nome AS cliente_nome, u.imagem_perfil_url AS cliente_imagem_url, u.telefone AS cliente_telefone
      ${baseSql}
    `;
    
    let conditions = [];

    // Adiciona a condição de busca pelo nome do cliente
    if (search) {
      conditions.push('u.nome LIKE ?');
      params.push(`%${search}%`);
    }

    // Adiciona a condição de filtro por status
    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }
    
    // Se houver condições, anexa à query
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      countSql += whereClause;
      sql += whereClause;
    }
    
    // 1. Conta o total de itens com os filtros aplicados
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // 2. Busca os pedidos da página atual com ordenação e paginação
    sql += ' ORDER BY p.data_pedido DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    // Adiciona os parâmetros de paginação DEPOIS dos parâmetros de filtro
    const finalParams = [...params, parseInt(limit), parseInt(offset)];
    
    const [pedidos] = await db.query(sql, finalParams);

    // 3. Retorna a resposta completa
    res.status(200).json({
      pedidos,
      totalPages,
      currentPage: parseInt(page)
    });

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

    // 1. Busca o status ATUAL do pedido
    const [pedidosAtuais] = await connection.query('SELECT status FROM pedidos WHERE id = ?', [pedidoId]);
    if (pedidosAtuais.length === 0) { throw new Error('Pedido não encontrado.'); }
    const statusAtual = pedidosAtuais[0].status;

    // Se o status já for o desejado, não faz nada.
    if(statusAtual === novoStatus) {
        await connection.commit();
        return res.status(200).json({ message: 'O pedido já está com este status.' });
    }

    // 2. Lógica para REATIVAR um pedido cancelado
    if (statusAtual === 'Cancelado') {
      const [itensDoPedido] = await connection.query('SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = ?', [pedidoId]);
      
      // Verifica se há estoque para todos os itens ANTES de reativar
      for (const item of itensDoPedido) {
        const [produto] = await connection.query('SELECT estoque FROM produtos WHERE id = ?', [item.produto_id]);
        if (produto[0].estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para reativar o pedido (produto ID: ${item.produto_id}).`);
        }
      }

      // Se houver estoque, deduz a quantidade de cada item
      for (const item of itensDoPedido) {
        await connection.query('UPDATE produtos SET estoque = estoque - ? WHERE id = ?', [item.quantidade, item.produto_id]);
      }
    }

    // 3. Atualiza o status e a data de entrega (se aplicável)
    let sql = 'UPDATE pedidos SET status = ?, cancelado_por = NULL'; // Limpa o 'cancelado_por'
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

    // 1. Busca o status ATUAL do pedido
    const [pedidosAtuais] = await connection.query('SELECT status, u.telefone FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?', [pedidoId]);
    if (pedidosAtuais.length === 0) { throw new Error('Pedido não encontrado.'); }
    
    // 2. VERIFICA se o pedido já não está cancelado para evitar devolução dupla de estoque
    if (pedidosAtuais[0].status === 'Cancelado') {
        throw new Error('Este pedido já está cancelado.');
    }
    
    const [itensDoPedido] = await connection.query('SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = ?', [pedidoId]);
    
    // 3. Devolve cada item ao estoque
    for (const item of itensDoPedido) {
      await connection.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [item.quantidade, item.produto_id]);
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