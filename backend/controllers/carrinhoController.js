// backend/controllers/carrinhoController.js
const db = require('../db');

// GET /api/carrinho - Busca os itens do carrinho do usuário logado
exports.getItensCarrinho = async (req, res) => {
  const usuarioId = req.user.id; // Vem do token (middleware verifyToken)
  try {
    const sql = `
      SELECT ci.produto_id, ci.quantidade, p.nome, p.valor, p.imagem_produto_url
      FROM carrinho_itens ci
      JOIN produtos p ON ci.produto_id = p.id
      WHERE ci.usuario_id = ?
    `;
    const [itens] = await db.query(sql, [usuarioId]);
    res.status(200).json(itens);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar itens do carrinho.', error: error.message });
  }
};

// POST /api/carrinho - Adiciona um item ao carrinho ou atualiza a quantidade
exports.adicionarItemCarrinho = async (req, res) => {
  const usuarioId = req.user.id;
  const { produto_id, quantidade } = req.body;

  try {
    // Verifica se o item já existe no carrinho do usuário
    const [existente] = await db.query(
      'SELECT * FROM carrinho_itens WHERE usuario_id = ? AND produto_id = ?',
      [usuarioId, produto_id]
    );

    if (existente.length > 0) {
      // Se existe, atualiza a quantidade
      const novaQuantidade = existente[0].quantidade + quantidade;
      await db.query(
        'UPDATE carrinho_itens SET quantidade = ? WHERE id = ?',
        [novaQuantidade, existente[0].id]
      );
    } else {
      // Se não existe, insere o novo item
      await db.query(
        'INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade) VALUES (?, ?, ?)',
        [usuarioId, produto_id, quantidade]
      );
    }
    res.status(201).json({ message: 'Item adicionado ao carrinho com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar item ao carrinho.', error: error.message });
  }
};

// DELETE /api/carrinho/:produtoId - Remove um item do carrinho
exports.removerItemCarrinho = async (req, res) => {
  const usuarioId = req.user.id;
  const { produtoId } = req.params;
  try {
    await db.query(
      'DELETE FROM carrinho_itens WHERE usuario_id = ? AND produto_id = ?',
      [usuarioId, produtoId]
    );
    res.status(200).json({ message: 'Item removido do carrinho com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover item do carrinho.', error: error.message });
  }
};