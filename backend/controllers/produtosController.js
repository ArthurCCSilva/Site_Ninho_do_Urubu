// backend/controllers/produtosController.js
const db = require('../db');

// --- Função Principal para buscar produtos (com filtros, join, ordenação e paginação) ---
exports.getAllProdutos = async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 7 } = req.query; // Limite padrão de 7

    let baseSql = 'FROM produtos p LEFT JOIN categorias c ON p.categoria_id = c.id';
    let params = [];
    let conditions = [];

    if (search) {
      conditions.push('(p.nome LIKE ? OR p.descricao LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push('c.nome = ?');
      params.push(category);
    }
    
    if (conditions.length > 0) {
      baseSql += ' WHERE ' + conditions.join(' AND ');
    }

    // 1. Primeiro, contamos o total de itens com os filtros aplicados para saber o total de páginas
    const countSql = `SELECT COUNT(p.id) as total ${baseSql}`;
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // 2. Depois, buscamos os produtos da página atual com ordenação
    let sql = `SELECT p.*, c.nome AS categoria_nome ${baseSql}`;
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
    } else {
      sql += ' ORDER BY p.id DESC'; // Ordenação padrão por mais recente
    }
    
    // Adiciona a paginação à query principal
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [produtos] = await db.query(sql, params);

    // 3. Retorna a resposta com os produtos e os dados da paginação
    res.status(200).json({
      produtos,
      totalPages,
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('Erro ao buscar produtos com filtros:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos.', error: error.message });
  }
};

// --- Função para buscar um produto pelo seu ID (com JOIN) ---
exports.getProdutoById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT p.*, c.nome AS categoria_nome FROM produtos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.id = ?`;
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