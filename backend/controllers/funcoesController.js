// backend/controllers/funcoesController.js
const db = require('../db');

exports.getAll = async (req, res) => {
    try {
        const [funcoes] = await db.query('SELECT id, nome_funcao FROM funcoes ORDER BY nome_funcao ASC');
        for (const funcao of funcoes) {
            const [permissoesRows] = await db.query(`
                SELECT p.chave_permissao 
                FROM permissoes p 
                JOIN funcao_permissoes fp ON p.id = fp.permissao_id 
                WHERE fp.funcao_id = ?`, [funcao.id]
            );
            funcao.permissoes = permissoesRows.map(p => p.chave_permissao);
        }
        res.status(200).json(funcoes);
    } catch (error) { 
        console.error("Erro ao buscar funções:", error);
        res.status(500).json({ message: 'Erro ao buscar funções.' }); 
    }
};

exports.create = async (req, res) => {
    const { nome_funcao, lista_permissoes } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        console.log(`--- Iniciando criação da função: ${nome_funcao} ---`);
        console.log("Permissões recebidas do frontend:", lista_permissoes);

        const [result] = await connection.query('INSERT INTO funcoes (nome_funcao) VALUES (?)', [nome_funcao]);
        const novaFuncaoId = result.insertId;
        console.log(`Função criada com sucesso. Novo ID: ${novaFuncaoId}`);

        if (lista_permissoes && lista_permissoes.length > 0) {
            const [permissoesExistentes] = await connection.query(
                'SELECT id, chave_permissao FROM permissoes WHERE chave_permissao IN (?)', 
                [lista_permissoes]
            );
            console.log("Permissões encontradas no banco de dados:", permissoesExistentes);
            
            if (permissoesExistentes.length > 0) {
                const values = permissoesExistentes.map(p => [novaFuncaoId, p.id]);
                console.log("Valores a serem inseridos em 'funcao_permissoes':", values);
                
                await connection.query('INSERT INTO funcao_permissoes (funcao_id, permissao_id) VALUES ?', [values]);
                console.log("Permissões associadas com sucesso!");
            } else {
                console.log("Nenhuma permissão correspondente encontrada no banco para associar.");
            }
        }

        await connection.commit();
        console.log("--- Transação finalizada com sucesso ---");
        res.status(201).json({ message: 'Função criada com sucesso!' });

    } catch (error) {
        await connection.rollback();
        console.error("!!! ERRO AO CRIAR FUNÇÃO - DESFAZENDO TUDO !!!", error);
        res.status(500).json({ message: 'Erro ao criar função.' });
    } finally {
        connection.release();
    }
};

// A função 'update' também foi atualizada com logs
exports.update = async (req, res) => {
    const { id } = req.params;
    const { nome_funcao, lista_permissoes } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        console.log(`--- Iniciando atualização da função ID: ${id} ---`);
        
        await connection.query('UPDATE funcoes SET nome_funcao = ? WHERE id = ?', [nome_funcao, id]);
        console.log("Nome da função atualizado.");

        await connection.query('DELETE FROM funcao_permissoes WHERE funcao_id = ?', [id]);
        console.log("Permissões antigas deletadas.");

        if (lista_permissoes && lista_permissoes.length > 0) {
            console.log("Novas permissões recebidas:", lista_permissoes);
            const [permissoesExistentes] = await connection.query(
                'SELECT id, chave_permissao FROM permissoes WHERE chave_permissao IN (?)', 
                [lista_permissoes]
            );
            console.log("Permissões correspondentes encontradas:", permissoesExistentes);

            if (permissoesExistentes.length > 0) {
                const values = permissoesExistentes.map(p => [id, p.id]);
                console.log("Valores a serem inseridos em 'funcao_permissoes':", values);
                
                await connection.query('INSERT INTO funcao_permissoes (funcao_id, permissao_id) VALUES ?', [values]);
                console.log("Novas permissões associadas com sucesso!");
            }
        }
        
        await connection.commit();
        console.log("--- Transação de atualização finalizada com sucesso ---");
        res.status(200).json({ message: 'Função atualizada com sucesso!' });

    } catch (error) {
        await connection.rollback();
        console.error(`!!! ERRO AO ATUALIZAR FUNÇÃO ID: ${id} - DESFAZENDO TUDO !!!`, error);
        res.status(500).json({ message: 'Erro ao atualizar função.' });
    } finally {
        connection.release();
    }
};

// Funções delete e getAllPermissoes permanecem as mesmas
exports.delete = async (req, res) => {
    const { id } = req.params; 
    try {
        await db.query('DELETE FROM funcoes WHERE id = ?', [id]);
        res.status(200).json({ message: 'Função deletada com sucesso!' });
    } catch (error) {
        console.error("Erro ao deletar função:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Não é possível excluir. Esta função está em uso por um ou mais funcionários.' });
        }
        res.status(500).json({ message: 'Erro ao deletar função.' });
    }
};

exports.getAllPermissoes = async (req, res) => {
    try {
        const [permissoes] = await db.query('SELECT * FROM permissoes');
        res.status(200).json(permissoes);
    } catch(err) { 
        res.status(500).json({ message: 'Erro ao buscar permissões.' }); 
    }
};