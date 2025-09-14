// backend/controllers/featureFlagsController.js
const db = require('../db');

// Rota pública para que o frontend saiba o que mostrar
exports.getAllPublic = async (req, res) => {
    try {
        const [flags] = await db.query('SELECT feature_key, is_enabled FROM feature_flags');
        res.status(200).json(flags);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar funcionalidades.' }); }
};

// ✅ FUNÇÃO ATUALIZADA: Agora aceita um filtro de categoria
exports.getAllForDev = async (req, res) => {
    try {
        const { page_category } = req.query;
        
        let sql = 'SELECT * FROM feature_flags';
        const params = [];

        if (page_category) {
            sql += ' WHERE page_category = ?';
            params.push(page_category);
        }
        
        sql += ' ORDER BY id';
        
        const [flags] = await db.query(sql, params);
        res.status(200).json(flags);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar funcionalidades.' }); }
};

exports.updateFlag = async (req, res) => {
    const { id } = req.params;
    const { is_enabled } = req.body;
    try {
        await db.query('UPDATE feature_flags SET is_enabled = ? WHERE id = ?', [is_enabled, id]);
        res.status(200).json({ message: 'Funcionalidade atualizada com sucesso!' });
    } catch (error) { res.status(500).json({ message: 'Erro ao atualizar funcionalidade.' }); }
};