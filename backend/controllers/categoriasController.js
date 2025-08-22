// backend/controllers/categoriasController.js
const db = require('../db');

// GET /api/categorias - Rota pública para buscar todas as categorias
exports.getAllCategorias = async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT * FROM categorias ORDER BY nome ASC');
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar categorias.', error: error.message });
  }
};

// POST /api/categorias - Rota de Admin para criar uma nova categoria
exports.createCategoria = async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) {
      return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
    }
    const [result] = await db.query('INSERT INTO categorias (nome) VALUES (?)', [nome]);
    res.status(201).json({ message: 'Categoria criada!', id: result.insertId, nome });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Essa categoria já existe.' });
    }
    res.status(500).json({ message: 'Erro ao criar categoria.', error: error.message });
  }
};

// DELETE /api/categorias/:id - Rota de Admin para deletar uma categoria
exports.deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM categorias WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }
    res.status(200).json({ message: 'Categoria deletada com sucesso.' });
  } catch (error) {
    // Trata o erro de chave estrangeira (se a categoria estiver em uso)
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ message: 'Não é possível excluir esta categoria, pois ela já está sendo usada por um ou mais produtos.' });
    }
    res.status(500).json({ message: 'Erro ao deletar categoria.', error: error.message });
  }
};