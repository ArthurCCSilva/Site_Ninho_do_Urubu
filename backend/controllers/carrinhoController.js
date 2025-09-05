// backend/controllers/carrinhoController.js
const db = require('../db');

exports.getItensCarrinho = async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const sql = `
      SELECT 
        ci.*, 
        p.nome, 
        p.valor, 
        p.imagem_produto_url,
        p.estoque_total,
        CASE WHEN bp.produto_id IS NOT NULL THEN TRUE ELSE FALSE END as elegivel_boleto
      FROM carrinho_itens ci
      JOIN produtos p ON ci.produto_id = p.id
      LEFT JOIN (
        SELECT DISTINCT produto_id FROM boleto_planos
      ) bp ON p.id = bp.produto_id
      WHERE ci.usuario_id = ?;
    `;
    const [itens] = await db.query(sql, [usuarioId]);
    res.status(200).json(itens);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar itens do carrinho.', error: error.message });
  }
};

// ✅ NOME CORRIGIDO de 'adicionarItemCarrinho' para 'adicionarItem'
exports.adicionarItem = async (req, res) => {
  const usuarioId = req.user.id;
  const { produto_id, quantidade } = req.body;

  try {
    const [existente] = await db.query(
      'SELECT * FROM carrinho_itens WHERE usuario_id = ? AND produto_id = ?',
      [usuarioId, produto_id]
    );

    if (existente.length > 0) {
      const novaQuantidade = existente[0].quantidade + quantidade;
      await db.query(
        'UPDATE carrinho_itens SET quantidade = ? WHERE id = ?',
        [novaQuantidade, existente[0].id]
      );
    } else {
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

// ✅ NOME CORRIGIDO de 'updateItemCarrinho' para 'updateQuantidadeItem'
exports.updateQuantidadeItem = async (req, res) => {
  const usuarioId = req.user.id;
  const { produto_id, quantidade } = req.body;

  if (quantidade < 1) {
    return res.status(400).json({ message: 'A quantidade não pode ser menor que 1.' });
  }

  try {
    const [produtos] = await db.query('SELECT estoque_total FROM produtos WHERE id = ?', [produto_id]);
    if (produtos.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    
    const estoqueDisponivel = produtos[0].estoque_total;
    if (quantidade > estoqueDisponivel) {
      return res.status(400).json({ message: `Estoque insuficiente. Apenas ${estoqueDisponivel} unidades disponíveis.` });
    }

    await db.query(
      'UPDATE carrinho_itens SET quantidade = ? WHERE usuario_id = ? AND produto_id = ?',
      [quantidade, usuarioId, produto_id]
    );
    
    res.status(200).json({ message: 'Quantidade atualizada com sucesso!' });

  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar a quantidade do item.', error: error.message });
  }
};


// ✅ NOME CORRIGIDO de 'removerItemCarrinho' para 'removerItem'
exports.removerItem = async (req, res) => {
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

exports.limparCarrinho = async (req, res) => {
  const usuarioId = req.user.id;
  try {
    await db.query('DELETE FROM carrinho_itens WHERE usuario_id = ?', [usuarioId]);
    res.status(200).json({ message: 'Carrinho limpo com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao limpar o carrinho.', error: error.message });
  }
};