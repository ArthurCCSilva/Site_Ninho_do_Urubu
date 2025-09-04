// backend/controllers/boletoDiasController.js
const db = require('../db');
exports.getAll = async (req, res) => {
    try {
        const [dias] = await db.query('SELECT * FROM boleto_dias_vencimento ORDER BY dia_vencimento ASC');
        res.status(200).json(dias);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar dias.' }); }
};
exports.add = async (req, res) => {
    try {
        const { dia } = req.body;
        await db.query('INSERT INTO boleto_dias_vencimento (dia_vencimento) VALUES (?)', [dia]);
        res.status(201).json({ message: 'Dia adicionado com sucesso!' });
    } catch (error) { res.status(500).json({ message: 'Erro ao adicionar dia.' }); }
};
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM boleto_dias_vencimento WHERE id = ?', [id]);
        res.status(200).json({ message: 'Dia deletado com sucesso.' });
    } catch (error) { res.status(500).json({ message: 'Erro ao deletar dia.' }); }
};