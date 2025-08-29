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

exports.createProduto = async (req, res) => {
  try {
    const { nome, descricao, valor, categoria_id, estoque, custo, destaque, promocao, produto_pai_id, unidades_por_pai } = req.body;
    const imagem_produto_url = req.file ? req.file.filename : null;
    if (!nome || !valor || !categoria_id) { return res.status(400).json({ message: 'Nome, valor e categoria são obrigatórios.' }); }
    const estoqueInicial = parseInt(estoque, 10) || 0;
    const custoInicial = parseFloat(custo) || 0;
    const custoTotalInventario = estoqueInicial * custoInicial;
    const custoMedioPonderado = estoqueInicial > 0 ? custoInicial : 0;
    const isDestaque = destaque === 'true' ? 1 : 0;
    const isPromocao = promocao === 'true' ? 1 : 0;
    const [result] = await db.query(
      'INSERT INTO produtos (nome, descricao, valor, categoria_id, estoque_total, custo_total_inventario, custo_medio_ponderado, imagem_produto_url, destaque, promocao, produto_pai_id, unidades_por_pai) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, descricao, valor, categoria_id, estoqueInicial, custoTotalInventario, custoMedioPonderado, imagem_produto_url, isDestaque, isPromocao, produto_pai_id || null, unidades_por_pai || null]
    );
    res.status(201).json({ message: 'Produto criado com sucesso!', produtoId: result.insertId });
  } catch (error) { res.status(500).json({ message: 'Erro ao criar produto.', error: error.message }); }
};

// ✅ FUNÇÃO ATUALIZADA: Agora salva a relação pai-filho
exports.updateProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, valor, categoria_id, destaque, promocao, produto_pai_id, unidades_por_pai } = req.body;
    const [produtoAtual] = await db.query('SELECT imagem_produto_url FROM produtos WHERE id = ?', [id]);
    const imagemAntiga = produtoAtual[0]?.imagem_produto_url;
    const imagem_produto_url = req.file ? req.file.filename : imagemAntiga;
    const isDestaque = destaque === 'true' ? 1 : 0;
    const isPromocao = promocao === 'true' ? 1 : 0;
    const sql = `UPDATE produtos SET nome = ?, descricao = ?, valor = ?, categoria_id = ?, destaque = ?, promocao = ?, produto_pai_id = ?, unidades_por_pai = ?, imagem_produto_url = ? WHERE id = ?`;
    const params = [nome, descricao, valor, categoria_id, isDestaque, isPromocao, produto_pai_id || null, unidades_por_pai || null, imagem_produto_url, id];
    await db.query(sql, params);
    if (req.file && imagemAntiga) {
      const caminhoImagemAntiga = path.join(__dirname, '..', 'uploads', imagemAntiga);
      try { await fs.unlink(caminhoImagemAntiga); } catch (fileErr) { console.error("Erro ao deletar imagem antiga:", fileErr.code); }
    }
    res.status(200).json({ message: 'Produto atualizado com sucesso!' });
  } catch (error) { res.status(500).json({ message: 'Erro ao atualizar produto.', error: error.message }); }
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

exports.darBaixaEstoque = async (req, res) => {
  const { id } = req.params;
  const { quantidade, motivo } = req.body;
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    const qtdPerdida = parseInt(quantidade, 10);
    if (isNaN(qtdPerdida) || qtdPerdida <= 0) {
      throw new Error('A quantidade para baixa deve ser um número positivo.');
    }
    
    const [rows] = await connection.query('SELECT estoque_total, custo_medio_ponderado, nome FROM produtos WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) { throw new Error('Produto não encontrado.'); }
    const produto = rows[0];
    
    if (qtdPerdida > produto.estoque_total) {
      throw new Error(`Baixa excede o estoque. Disponível: ${produto.estoque_total}.`);
    }

    const custoDaPerda = qtdPerdida * produto.custo_medio_ponderado;
    const novoEstoque = produto.estoque_total - qtdPerdida;
    const novoCustoTotalInventario = novoEstoque * produto.custo_medio_ponderado;

    // Atualiza o produto
    await connection.query(
      'UPDATE produtos SET estoque_total = ?, custo_total_inventario = ? WHERE id = ?',
      [novoEstoque, novoCustoTotalInventario, id]
    );

    // Registra como uma despesa
    await connection.query(
      'INSERT INTO despesas (descricao, valor, data, categoria_id) VALUES (?, ?, CURDATE(), (SELECT id FROM despesa_categorias WHERE nome = "Perda de Inventário"))',
      [`Baixa de estoque: ${qtdPerdida}x ${produto.nome}. Motivo: ${motivo}`, custoDaPerda]
    );

    await connection.commit();
    res.status(200).json({ message: 'Baixa de estoque registrada com sucesso como despesa.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: `Erro ao dar baixa no estoque: ${error.message}` });
  } finally {
    connection.release();
  }
};

exports.corrigirEstoque = async (req, res) => {
  const { id } = req.params;
  const { quantidadeParaRemover } = req.body;
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const qtdRemover = parseInt(quantidadeParaRemover, 10);
    if (isNaN(qtdRemover) || qtdRemover <= 0) {
      throw new Error('A quantidade para correção deve ser um número positivo.');
    }
    
    const [rows] = await connection.query('SELECT estoque_total, custo_medio_ponderado FROM produtos WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) { throw new Error('Produto não encontrado.'); }
    const produto = rows[0];
    
    if (qtdRemover > produto.estoque_total) {
      throw new Error(`Correção excede o estoque. Disponível: ${produto.estoque_total}.`);
    }

    // Apenas recalcula o estoque e o valor total do inventário
    const novoEstoque = produto.estoque_total - qtdRemover;
    const novoCustoTotalInventario = novoEstoque * produto.custo_medio_ponderado;

    // Atualiza o produto
    await connection.query(
      'UPDATE produtos SET estoque_total = ?, custo_total_inventario = ? WHERE id = ?',
      [novoEstoque, novoCustoTotalInventario, id]
    );
    
    // NENHUMA despesa é criada aqui.
    
    await connection.commit();
    res.status(200).json({ message: 'Estoque corrigido com sucesso!' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: `Erro ao corrigir o estoque: ${error.message}` });
  } finally {
    connection.release();
  }
};

exports.desmembrarProduto = async (req, res) => {
  const { id: produtoPaiId } = req.params;
  const { quantidadeFardos } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [pais] = await connection.query('SELECT * FROM produtos WHERE id = ? FOR UPDATE', [produtoPaiId]);
    if (pais.length === 0) throw new Error('Produto "pai" (fardo) não encontrado.');
    const pai = pais[0];
    if (!pai.unidades_por_pai || pai.unidades_por_pai <= 0) throw new Error('Este produto não está configurado para ser desmembrado (defina "Unidades por Fardo" no cadastro do produto).');
    const [filhos] = await connection.query('SELECT * FROM produtos WHERE produto_pai_id = ? FOR UPDATE', [produtoPaiId]);
    if (filhos.length === 0) throw new Error('Nenhum produto "filho" (unidade) está associado a este fardo.');
    const filho = filhos[0];
    const qtdFardos = parseInt(quantidadeFardos, 10);
    if (qtdFardos > pai.estoque_total) throw new Error('Estoque insuficiente do fardo para desmembrar.');
    const custoPorFardo = pai.custo_medio_ponderado;
    const custoPorUnidadeFilho = custoPorFardo / pai.unidades_por_pai;
    const quantidadeUnidadesAdicionar = qtdFardos * pai.unidades_por_pai;
    const custoTotalAdicionar = quantidadeUnidadesAdicionar * custoPorUnidadeFilho;
    const novoEstoquePai = pai.estoque_total - qtdFardos;
    const novoCustoTotalPai = novoEstoquePai * custoPorFardo;
    await connection.query('UPDATE produtos SET estoque_total = ?, custo_total_inventario = ? WHERE id = ?', [novoEstoquePai, novoCustoTotalPai, produtoPaiId]);
    const novoEstoqueFilho = filho.estoque_total + quantidadeUnidadesAdicionar;
    const novoCustoTotalFilho = parseFloat(filho.custo_total_inventario) + custoTotalAdicionar;
    const novoCustoMedioFilho = novoCustoTotalFilho > 0 ? novoCustoTotalFilho / novoEstoqueFilho : 0;
    await connection.query('UPDATE produtos SET estoque_total = ?, custo_total_inventario = ?, custo_medio_ponderado = ? WHERE id = ?', [novoEstoqueFilho, novoCustoTotalFilho, novoCustoMedioFilho, filho.id]);
    await connection.commit();
    res.status(200).json({ message: `${qtdFardos} fardo(s) de ${pai.nome} desmembrados em ${quantidadeUnidadesAdicionar} unidades de ${filho.nome}.` });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: `Erro ao desmembrar produto: ${error.message}` });
  } finally {
    connection.release();
  }
};