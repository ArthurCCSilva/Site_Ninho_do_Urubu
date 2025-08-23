// backend/controllers/categoriasController.js
const db = require('../db');

// ✅ FUNÇÃO ATUALIZADA para aceitar busca e paginação
exports.getAllCategorias = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query; // Padrão: página 1, 10 itens por página

    let countSql = 'SELECT COUNT(*) as total FROM categorias';
    let sql = 'SELECT * FROM categorias';
    const params = [];
    
    // Lógica de busca
    if (search) {
      countSql += ' WHERE nome LIKE ?';
      sql += ' WHERE nome LIKE ?';
      params.push(`%${search}%`);
    }

    // 1. Primeiro, contamos o total de itens (respeitando a busca)
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // 2. Depois, buscamos os itens da página atual
    sql += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), parseInt(offset));
    
    const [categorias] = await db.query(sql, params);

    // 3. Enviamos a resposta com os dados e as informações de paginação
    res.status(200).json({
      categorias,
      totalPages,
      currentPage: parseInt(page)
    });

  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar categorias.', error: error.message });
  }
};

// ✅ FUNÇÃO NOVA para editar/atualizar uma categoria
exports.updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    if (!nome) {
      return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
    }
    const [result] = await db.query('UPDATE categorias SET nome = ? WHERE id = ?', [nome, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }
    res.status(200).json({ message: 'Categoria atualizada com sucesso!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Essa categoria já existe.' });
    }
    res.status(500).json({ message: 'Erro ao atualizar categoria.', error: error.message });
  }
};

// --- Função mantida (já estava correta) ---
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

// --- Função mantida (já estava correta) ---
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