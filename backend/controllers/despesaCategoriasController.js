// backend/controllers/despesaCategoriasController.js
const db = require('../db');

// GET / - Busca todas as categorias de despesa
exports.getAll = async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT * FROM despesa_categorias ORDER BY nome ASC');
    res.status(200).json(categorias);
  } catch (error) {
    console.error("Erro ao buscar categorias de despesa:", error);
    res.status(500).json({ message: 'Erro ao buscar categorias de despesa.' });
  }
};

// POST / - Cria uma nova categoria de despesa
exports.create = async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
    }
    const [result] = await db.query(
      'INSERT INTO despesa_categorias (nome) VALUES (?)',
      [nome]
    );
    res.status(201).json({ message: 'Categoria de despesa criada com sucesso!', id: result.insertId });
  } catch (error) {
    // Verifica se o erro é de entrada duplicada (nome único)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Uma categoria com este nome já existe.' });
    }
    console.error("Erro ao criar categoria de despesa:", error);
    res.status(500).json({ message: 'Erro ao criar categoria de despesa.' });
  }
};

// DELETE /:id - Deleta uma categoria de despesa
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM despesa_categorias WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoria de despesa não encontrada.' });
    }

    res.status(200).json({ message: 'Categoria de despesa deletada com sucesso.' });
  } catch (error) {
    // Verifica se o erro é de violação de chave estrangeira
    // Isso acontece se você tentar deletar uma categoria que já está sendo usada em uma despesa
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ message: 'Não é possível excluir esta categoria, pois ela já está em uso por uma ou mais despesas.' });
    }
    console.error("Erro ao deletar categoria de despesa:", error);
    res.status(500).json({ message: 'Erro ao deletar categoria de despesa.' });
  }
};