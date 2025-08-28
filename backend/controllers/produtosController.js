// backend/controllers/produtosController.js
const db = require('../db');
const fs = require('fs').promises;
const path = require('path');

// getAllProdutos e getProdutoById não precisam de grandes alterações, apenas usar 'estoque_total'
exports.getAllProdutos = async (req, res) => {
  try {
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
    if (destaque === 'true') {
      conditions.push('p.destaque = TRUE');
    }
    if (conditions.length > 0) {
      baseSql += ' WHERE ' + conditions.join(' AND ');
    }
    const countSql = `SELECT COUNT(p.id) as total ${baseSql}`;
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0].total;
    const numericLimit = parseInt(limit) || 12;
    const totalPages = Math.ceil(totalItems / numericLimit);
    let sql = `SELECT p.*, c.nome AS categoria_nome ${baseSql}`;
    if (sort) {
      const allowedSorts = {
        'stock_asc': 'ORDER BY p.estoque_total ASC',
        'stock_desc': 'ORDER BY p.estoque_total DESC',
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
    res.status(200).json({ produtos, totalPages, currentPage: parseInt(page) });
  } catch (error) {
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

// ✅ ATUALIZADO: Agora aceita estoque inicial e custo inicial
exports.createProduto = async (req, res) => {
  try {
    const { nome, descricao, valor, categoria_id, estoque, custo, destaque, promocao } = req.body;
    const imagem_produto_url = req.file ? req.file.filename : null;

    if (!nome || !valor || !categoria_id || estoque === undefined || custo === undefined) {
      return res.status(400).json({ message: 'Todos os campos, incluindo estoque inicial e custo, são obrigatórios.' });
    }

    const estoqueInicial = parseInt(estoque, 10);
    const custoInicial = parseFloat(custo);

    // Calcula os valores iniciais para o Custo Médio Ponderado
    const custoTotalInventario = estoqueInicial * custoInicial;
    const custoMedioPonderado = estoqueInicial > 0 ? custoInicial : 0;
    
    const isDestaque = destaque === 'true' ? 1 : 0;
    const isPromocao = promocao === 'true' ? 1 : 0;

    const [result] = await db.query(
      'INSERT INTO produtos (nome, descricao, valor, categoria_id, estoque_total, custo_total_inventario, custo_medio_ponderado, imagem_produto_url, destaque, promocao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, descricao, valor, categoria_id, estoqueInicial, custoTotalInventario, custoMedioPonderado, imagem_produto_url, isDestaque, isPromocao]
    );
    res.status(201).json({ message: 'Produto criado com sucesso!', produtoId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar produto.', error: error.message });
  }
};

// --- Função para ATUALIZAR um produto (usando categoria_id) ---
exports.updateProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, valor, categoria_id, destaque, promocao } = req.body;
    
    const [produtosAtuais] = await db.query('SELECT imagem_produto_url FROM produtos WHERE id = ?', [id]);
    if (produtosAtuais.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    const imagemAntiga = produtosAtuais[0].imagem_produto_url;
    
    const imagem_produto_url = req.file ? req.file.filename : imagemAntiga;
    
    const isDestaque = destaque === 'true' ? 1 : 0;
    const isPromocao = promocao === 'true' ? 1 : 0;

    const sql = `UPDATE produtos SET nome = ?, descricao = ?, valor = ?, categoria_id = ?, destaque = ?, promocao = ?, imagem_produto_url = ? WHERE id = ?`;
    const params = [nome, descricao, valor, categoria_id, isDestaque, isPromocao, imagem_produto_url, id];

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

// ✅ ATUALIZADO: Agora aceita um 'novoValorVenda' opcional
exports.adicionarEstoque = async (req, res) => {
  const { id } = req.params;
  const { quantidadeAdicional, custoUnitarioEntrada, novoValorVenda } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const quantidade = parseInt(quantidadeAdicional, 10);
    const custoEntrada = parseFloat(custoUnitarioEntrada);
    if (isNaN(quantidade) || quantidade <= 0 || isNaN(custoEntrada) || custoEntrada < 0) {
      throw new Error('Quantidade e valor de entrada devem ser números positivos.');
    }

    const [rows] = await connection.query('SELECT estoque_total, custo_total_inventario FROM produtos WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) { throw new Error('Produto não encontrado.'); }
    const produto = rows[0];

    const custoTotalEntrada = quantidade * custoEntrada;
    const novoEstoqueTotal = produto.estoque_total + quantidade;
    const novoCustoTotalInventario = parseFloat(produto.custo_total_inventario) + custoTotalEntrada;
    const novoCustoMedio = novoCustoTotalInventario / novoEstoqueTotal;
    
    // Constrói a query de atualização dinamicamente
    let updateFields = ['estoque_total = ?', 'custo_total_inventario = ?', 'custo_medio_ponderado = ?'];
    const params = [novoEstoqueTotal, novoCustoTotalInventario, novoCustoMedio];

    // Se um novo valor de venda foi fornecido, adiciona à query
    if (novoValorVenda && !isNaN(parseFloat(novoValorVenda))) {
      updateFields.push('valor = ?');
      params.push(parseFloat(novoValorVenda));
    }
    
    params.push(id);
    const sql = `UPDATE produtos SET ${updateFields.join(', ')} WHERE id = ?`;

    await connection.query(sql, params);
    await connection.commit();
    res.status(200).json({ message: 'Estoque e/ou valor atualizados com sucesso!' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: `Erro ao adicionar estoque: ${error.message}` });
  } finally {
    connection.release();
  }
};