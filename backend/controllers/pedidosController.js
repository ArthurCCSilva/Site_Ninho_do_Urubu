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

  try {
    // Lógica de segurança: só permite cancelar se o pedido for do usuário
    // e se o status ainda for 'Processando'.
    const [result] = await db.query(
      "UPDATE pedidos SET status = 'Cancelado' WHERE id = ? AND usuario_id = ? AND status = 'Processando'",
      [pedidoId, usuarioId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado, não pertence a você ou não pode mais ser cancelado.' });
    }

    // Futuramente, aqui entraria a lógica para devolver os itens ao estoque.

    res.status(200).json({ message: 'Pedido cancelado com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cancelar pedido.', error: error.message });
  }
};