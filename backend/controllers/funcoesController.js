const db = require('../db');

exports.getAll = async (req, res) => {
    try {
        const [funcoes] = await db.query('SELECT * FROM funcoes ORDER BY nome_funcao ASC');
        for (const funcao of funcoes) {
            const [permissoes] = await db.query(`
                SELECT p.id, p.chave_permissao 
                FROM permissoes p 
                JOIN funcao_permissoes fp ON p.id = fp.permissao_id 
                WHERE fp.funcao_id = ?`, [funcao.id]
            );
            funcao.permissoes = permissoes.map(p => p.chave_permissao);
        }
        res.status(200).json(funcoes);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar funções.' }); }
};
exports.create = async (req, res) => {
    const { nome_funcao } = req.body;
    try {
        await db.query('INSERT INTO funcoes (nome_funcao) VALUES (?)', [nome_funcao]);
        res.status(201).json({ message: 'Função criada com sucesso!' });
    } catch (error) { res.status(500).json({ message: 'Erro ao criar função.' }); }
};
exports.updatePermissions = async (req, res) => {
    const { funcaoId } = req.params;
    const { permissoes } = req.body; // Espera um array de chaves: ['acessar_comandas', ...]
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM funcao_permissoes WHERE funcao_id = ?', [funcaoId]);
        if (permissoes && permissoes.length > 0) {
            const [permissoesIds] = await connection.query('SELECT id, chave_permissao FROM permissoes WHERE chave_permissao IN (?)', [permissoes]);
            const values = permissoesIds.map(p => [funcaoId, p.id]);
            await connection.query('INSERT INTO funcao_permissoes (funcao_id, permissao_id) VALUES ?', [values]);
        }
        await connection.commit();
        res.status(200).json({ message: 'Permissões atualizadas com sucesso!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Erro ao atualizar permissões.' });
    } finally {
        connection.release();
    }
};
exports.delete = async (req, res) => {
    const { funcaoId } = req.params;
    try {
        await db.query('DELETE FROM funcoes WHERE id = ?', [funcaoId]);
        res.status(200).json({ message: 'Função deletada com sucesso!' });
    } catch (error) { res.status(500).json({ message: 'Erro ao deletar função.' }); }
};
exports.getAllPermissoes = async (req, res) => {
    try {
        const [permissoes] = await db.query('SELECT * FROM permissoes');
        res.status(200).json(permissoes);
    } catch(err) { res.status(500).json({ message: 'Erro ao buscar permissões.' }); }
};