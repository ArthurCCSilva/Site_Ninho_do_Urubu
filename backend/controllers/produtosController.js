// /controllers/produtosController.js
const db = require('../db');

// Rota pública - qualquer um pode ver
exports.getAllProdutos = async (req, res) => {
  try {
    const [produtos] = await db.query('SELECT * FROM produtos');
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar produtos.', error: error.message });
  }
};

// Rota pública - buscar um produto pelo ID
exports.getProdutoById = async (req, res) => {
  try {
    const { id } = req.params;

    const [produtos] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);

    if (produtos.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    res.status(200).json(produtos[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar produto.', error: error.message });
  }
};


// --- FUNÇÃO DE PESQUISA---
// Rota pública - qualquer um pode pesquisar
exports.pesquisarProduto = async (req, res) => {
  try {
    // 1. Pegar o termo de pesquisa da query string da URL (ex: /pesquisar?q=termo)
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Termo de pesquisa não fornecido.' });
    }

    // 2. Montar o termo para a busca com LIKE
    const termoPesquisa = `%${q}%`;

    // 3. Executar a query usando LIKE para buscar no nome e na descrição
    const [produtos] = await db.query(
      'SELECT * FROM produtos WHERE nome LIKE ? OR descricao LIKE ?',
      [termoPesquisa, termoPesquisa]
    );

    // 4. Verificar se encontrou resultados
    if (produtos.length === 0) {
      return res.status(404).json({ message: 'Nenhum produto encontrado com o termo pesquisado.' });
    }

    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao pesquisar produtos.', error: error.message });
  }
};


// Rota protegida - só admin pode criar
exports.createProduto = async (req, res) => {
  try {
    // 1. Os dados de texto, vêm de req.body
    const { nome, descricao, valor, categoria, estoque } = req.body;

    // 2. A informação da imagem vem de req.file (se o usuário enviar uma)
    const imagem_produto_url = req.file ? req.file.filename : null;

    // 3. Validação robusta para os campos obrigatórios
    //    Verificamos se 'estoque' não é undefined para permitir o valor 0
    if(!nome || !valor || !categoria || estoque === undefined){
      return res.status(400).json({message: 'Nome, valor, categoria e estoque são obrigatórios.'});
    }

    const [result] = await db.query(
      'INSERT INTO produtos (nome, descricao, valor, categoria, imagem_produto_url, estoque) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, descricao, valor, categoria, imagem_produto_url, estoque]
    );

    res.status(201).json({ message: 'Produto criado!', produtoId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar produto.', error: error.message });
  }
};

// Rota protegida - só admin pode alterar
exports.updateProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, valor, categoria, imagem_produto_url } = req.body;

    const [result] = await db.query(
      'UPDATE produtos SET nome = ?, descricao = ?, valor = ?, categoria = ?, imagem_produto_url = ? WHERE id = ?',
      [nome, descricao, valor, categoria, imagem_produto_url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    res.status(200).json({ message: 'Produto atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar produto.', error: error.message });
  }
};

// Rota protegida - só admin pode deletar
exports.deleteProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM produtos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    res.status(200).json({ message: 'Produto deletado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar produto.', error: error.message });
  }
};