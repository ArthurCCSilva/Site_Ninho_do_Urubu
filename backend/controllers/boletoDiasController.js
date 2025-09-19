// backend/controllers/boletoDiasController.js
const db = require('../db');

exports.getAll = async (req, res) => {
    try {
        const [dias] = await db.query('SELECT * FROM boleto_dias_vencimento ORDER BY dia_vencimento ASC');
        res.status(200).json(dias);
    } catch (error) { 
        res.status(500).json({ message: 'Erro ao buscar dias.' }); 
    }
};

// ✅ FUNÇÃO 'ADD' ATUALIZADA E SEGURA
exports.add = async (req, res) => {
    // 1. Pega o dia do corpo da requisição
    const { dia } = req.body;

    // 2. Valida se o dia é um número válido entre 1 e 31
    const diaNum = parseInt(dia, 10);
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
        return res.status(400).json({ message: 'Por favor, insira um dia válido entre 1 e 31.' });
    }

    try {
        // 3. Tenta inserir no banco de dados
        const sql = 'INSERT INTO boleto_dias_vencimento (dia_vencimento) VALUES (?)';
        await db.query(sql, [diaNum]);

        res.status(201).json({ message: `Dia ${diaNum} adicionado com sucesso!` });

    } catch (error) {
        // 4. Trata erros, especialmente se o dia já existir (erro de duplicidade)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: `O dia ${diaNum} já está cadastrado.` });
        }
        console.error("Erro ao adicionar dia de vencimento:", error);
        res.status(500).json({ message: 'Erro no servidor ao adicionar dia de vencimento.' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM boleto_dias_vencimento WHERE id = ?', [id]);
        res.status(200).json({ message: 'Dia deletado com sucesso.' });
    } catch (error) { 
        res.status(500).json({ message: 'Erro ao deletar dia.' }); 
    }
};