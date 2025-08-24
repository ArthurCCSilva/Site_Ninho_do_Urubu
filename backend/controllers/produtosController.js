// backend/controllers/produtosController.js
const db = require('../db');

// --- Função Principal para buscar produtos (com filtros, join e ordenação) ---
// Esta função substitui a sua 'getAllProdutos' antiga e a 'pesquisarProduto'
exports.getAllProdutos = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    
    // Query base com JOIN para buscar o nome da categoria na tabela 'categorias'
    let sql = `
      SELECT p.*, c.nome AS categoria_nome 
      FROM produtos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id
    `;
    const params = [];
    let conditions = [];

    // Lógica de busca por nome ou descrição
    if (search) {
      conditions.push('(p.nome LIKE ? OR p.descricao LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Lógica de filtro por nome da categoria
    if (category) {
      conditions.push('c.nome = ?');
      params.push(category);
    }
    
    // Constrói a cláusula WHERE se houver condições
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Lógica de ordenação segura
    if (sort) {
      const allowedSorts = {
        'price_asc': 'ORDER BY p.valor ASC',
        'price_desc': 'ORDER BY p.valor DESC',
        'name_asc': 'ORDER BY p.nome ASC',
        'name_desc': 'ORDER BY p.nome DESC',
      };
      if (allowedSorts[sort]) {
        sql += ` ${allowedSorts[sort]}`;
      }
    }

    const [produtos] = await db.query(sql, params);
    res.status(200).json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos com filtros:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos.', error: error.message });
  }
};

// --- Função para buscar um produto pelo seu ID (com JOIN) ---
// Esta função está atualizada para trazer o nome da categoria
exports.getProdutoById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT p.*, c.nome AS categoria_nome 
      FROM produtos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id 
      WHERE p.id = ?
    `;
    const [produtos] = await db.query(sql, [id]);

    if (produtos.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    res.status(200).json(produtos[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar produto.', error: error.message });
  }
};

// --- Função para CRIAR um novo produto (usando categoria_id) ---
// Esta função está atualizada para usar 'categoria_id' (número) em vez de 'categoria' (texto)
exports.createProduto = async (req, res) => {
  


  try {
    const { nome, descricao, valor, categoria_id, estoque } = req.body;
    const imagem_produto_url = req.file ? req.file.filename : null;

    if (!nome || !valor || !categoria_id || estoque === undefined) {
      return res.status(400).json({ message: 'Nome, valor, ID da categoria e estoque são obrigatórios.' });
    }

    const [result] = await db.query(
      'INSERT INTO produtos (nome, descricao, valor, categoria_id, estoque, imagem_produto_url) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, descricao, valor, categoria_id, estoque, imagem_produto_url]
    );
    res.status(201).json({ message: 'Produto criado!', produtoId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar produto.', error: error.message });
  }
};

// --- Função para ATUALIZAR um produto (usando categoria_id) ---
// Esta função está atualizada para usar 'categoria_id'
exports.updateProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, valor, categoria_id, estoque } = req.body;
    const imagem_produto_url = req.file ? req.file.filename : null;
    
    let sql = 'UPDATE produtos SET nome = ?, descricao = ?, valor = ?, categoria_id = ?, estoque = ?';
    const params = [nome, descricao, valor, categoria_id, estoque];

    if (imagem_produto_url) {
      sql += ', imagem_produto_url = ?';
      params.push(imagem_produto_url);
    }
    sql += ' WHERE id = ?';
    params.push(id);

    const [result] = await db.query(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    res.status(200).json({ message: 'Produto atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar produto.', error: error.message });
  }
};

// --- Função para DELETAR um produto ---
// Esta função não precisou de alterações
exports.deleteProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM produtos WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    res.status(200).json({ message: 'Produto deletado com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar produto.', error: error.message });
  }
};