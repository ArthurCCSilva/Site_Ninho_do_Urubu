// backend/controllers/categoriasController.js
const db = require('../db');

// ✅ FUNÇÃO ATUALIZADA para aceitar busca e paginação
exports.getAllCategorias = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    let countSql = 'SELECT COUNT(*) as total FROM categorias';
    let sql = 'SELECT * FROM categorias';
    const params = [];
    
    if (search) {
      const whereClause = ' WHERE nome LIKE ?';
      countSql += whereClause;
      sql += whereClause;
      params.push(`%${search}%`);
    }

    // Primeiro, sempre contamos o total de itens (respeitando a busca)
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0].total;
    
    sql += ' ORDER BY nome ASC';
    
    let totalPages = 0; // Inicia com 0

    // Lógica crucial corrigida:
    if (limit !== 'all') {
      // Se o limite NÃO for 'all', fazemos a matemática e adicionamos a paginação
      totalPages = Math.ceil(totalItems / limit);
      const offset = (page - 1) * limit;
      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
    } else {
      // Se o limite FOR 'all', simplesmente definimos totalPages como 1
      totalPages = 1;
    }
    
    const [categorias] = await db.query(sql, params);

    res.status(200).json({
      categorias,
      totalPages,
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
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