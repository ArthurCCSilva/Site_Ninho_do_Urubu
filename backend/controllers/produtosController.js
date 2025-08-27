// backend/controllers/produtosController.js
const db = require('../db');
const fs = require('fs').promises;
const path = require('path');

// --- Função Principal para buscar produtos (com filtros, join, ordenação e paginação) ---
exports.getAllProdutos = async (req, res) => {
  try {
    // ✅ CORREÇÃO: Adiciona 'destaque' à desestruturação para poder usá-lo
    const { search, category, sort, page = 1, limit = 12, destaque } = req.query;

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
    // Adiciona o filtro de destaque, se solicitado
    if (destaque === 'true') {
      conditions.push('p.destaque = TRUE');
    }
    
    if (conditions.length > 0) {
      baseSql += ' WHERE ' + conditions.join(' AND ');
    }

    const countSql = `SELECT COUNT(p.id) as total ${baseSql}`;
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0].total;
    // O limite para o cálculo deve ser um número
    const numericLimit = parseInt(limit, 10);
    const totalPages = Math.ceil(totalItems / numericLimit);

    let sql = `SELECT p.*, c.nome AS categoria_nome ${baseSql}`;
    if (sort) {
      const allowedSorts = {
        'price_asc': 'ORDER BY p.estoque ASC',
        'price_desc': 'ORDER BY p.estoque DESC',
        'name_asc': 'ORDER BY p.nome ASC',
        'name_desc': 'ORDER BY p.nome DESC',
      };
      if (allowedSorts[sort]) {
        sql += ` ${allowedSorts[sort]}`;
      }
    } else {
      sql += ' ORDER BY p.id DESC';
    }
    
    const offset = (page - 1) * numericLimit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(numericLimit, offset);
    
    const [produtos] = await db.query(sql, params);

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
    // ✅ CORREÇÃO: Remove a vírgula extra depois de 'estoque'
    const { nome, descricao, valor, categoria_id, estoque, destaque, promocao } = req.body;
    const imagem_produto_url = req.file ? req.file.filename : null;
    if (!nome || !valor || !categoria_id || estoque === undefined) {
      return res.status(400).json({ message: 'Nome, valor, ID da categoria e estoque são obrigatórios.' });
    }

    const isDestaque = destaque === 'true' ? 1 : 0;
    const isPromocao = promocao === 'true' ? 1 : 0;

    const [result] = await db.query(
      'INSERT INTO produtos (nome, descricao, valor, categoria_id, estoque, imagem_produto_url, destaque, promocao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      // ✅ CORREÇÃO: Remove a vírgula extra do array de parâmetros
      [nome, descricao, valor, categoria_id, estoque, imagem_produto_url, isDestaque, isPromocao]
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
    const { nome, descricao, valor, categoria_id, estoque, destaque, promocao } = req.body;
    
    const [produtosAtuais] = await db.query('SELECT imagem_produto_url FROM produtos WHERE id = ?', [id]);
    if (produtosAtuais.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    const imagemAntiga = produtosAtuais[0].imagem_produto_url;
    
    const imagem_produto_url = req.file ? req.file.filename : imagemAntiga;
    
    const isDestaque = destaque === 'true' ? 1 : 0;
    const isPromocao = promocao === 'true' ? 1 : 0;

    const sql = `UPDATE produtos SET nome = ?, descricao = ?, valor = ?, categoria_id = ?, estoque = ?, destaque = ?, promocao = ?, imagem_produto_url = ? WHERE id = ?`;
    const params = [nome, descricao, valor, categoria_id, estoque, isDestaque, isPromocao, imagem_produto_url, id];

    await db.query(sql, params);

    if (req.file && imagemAntiga) {
      // ✅ CORREÇÃO DO CAMINHO AQUI
      const caminhoImagemAntiga = path.join(__dirname, '..', 'uploads', imagemAntiga);
      try {
        await fs.unlink(caminhoImagemAntiga);
        console.log(`Imagem antiga de produto ${imagemAntiga} deletada.`);
      } catch (fileErr) {
        console.error("Erro ao deletar a imagem antiga do produto:", fileErr.code);
      }
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

    const [produtos] = await db.query('SELECT imagem_produto_url FROM produtos WHERE id = ?', [id]);
    if (produtos.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    const imagemUrl = produtos[0].imagem_produto_url;

    await db.query('DELETE FROM produtos WHERE id = ?', [id]);

    if (imagemUrl) {
      // ✅ CORREÇÃO DO CAMINHO AQUI
      const caminhoImagem = path.join(__dirname, '..', 'uploads', imagemUrl);
      try {
        await fs.unlink(caminhoImagem);
        console.log(`Arquivo de imagem ${imagemUrl} deletado com sucesso.`);
      } catch (fileErr) {
        console.error("Erro ao deletar o arquivo de imagem do produto:", fileErr.code);
      }
    }

    res.status(200).json({ message: 'Produto deletado com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar produto.', error: error.message });
  }
};

// ✅ NOVA FUNÇÃO para ADICIONAR (somar) ao estoque de um produto
exports.adicionarEstoque = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidadeAdicional } = req.body;

    // Validação para garantir que a quantidade é um número inteiro positivo
    const quantidade = parseInt(quantidadeAdicional, 10);
    if (isNaN(quantidade) || quantidade <= 0) {
      return res.status(400).json({ message: 'A quantidade a ser adicionada deve ser um número inteiro positivo.' });
    }

    // Query SQL que SOMA o valor ao estoque existente
    const sql = 'UPDATE produtos SET estoque = estoque + ? WHERE id = ?';
    const [result] = await db.query(sql, [quantidade, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    res.status(200).json({ message: 'Estoque atualizado com sucesso!' });
  } catch (error) {
    console.error("Erro ao adicionar estoque:", error);
    res.status(500).json({ message: 'Erro ao atualizar o estoque.', error: error.message });
  }
};