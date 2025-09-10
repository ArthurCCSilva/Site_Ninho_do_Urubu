// backend/controllers/boletosController.js
const db = require('../db');

exports.getBoletosParaAprovacao = async (req, res) => {
    try {
        const sql = `
            SELECT p.id, p.data_pedido, p.valor_total, u.nome as cliente_nome
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.status = 'Aguardando Aprovação Boleto'
            ORDER BY p.data_pedido ASC
        `;
        const [pedidos] = await db.query(sql);
        res.status(200).json(pedidos);
    } catch (error) { 
        console.error("Erro ao buscar boletos para aprovação:", error);
        res.status(500).json({ message: 'Erro ao buscar boletos para aprovação.' }); 
    }
};

exports.getCarnesEmAberto = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        let params = [];
        let searchClause = '';
        if (search) {
            searchClause = 'AND (u.nome LIKE ? OR u.email LIKE ? OR u.cpf LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        const baseSql = `
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            JOIN boleto_pedidos bp ON p.id = bp.pedido_id
            WHERE p.status = 'Boleto em Pagamento' ${searchClause}
        `;
        const countSql = `SELECT COUNT(DISTINCT p.id) as total ${baseSql}`;
        const [countRows] = await db.query(countSql, params);
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);
        const offset = (page - 1) * limit;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const sql = `
            SELECT 
                p.id as pedido_id,
                p.valor_total,
                u.nome as cliente_nome,
                u.cpf as cliente_cpf,
                u.telefone as cliente_telefone,
                u.imagem_perfil_url
            ${baseSql}
            ORDER BY p.data_pedido DESC
            LIMIT ? OFFSET ?
        `;
        const [pedidos] = await db.query(sql, finalParams);
        for (const pedido of pedidos) {
            const [parcelas] = await db.query(
                `SELECT bp.* FROM boleto_parcelas bp 
                 JOIN boleto_pedidos b ON bp.boleto_pedido_id = b.id 
                 WHERE b.pedido_id = ? ORDER BY bp.numero_parcela ASC`,
                [pedido.pedido_id]
            );
            pedido.parcelas = parcelas;
        }
        res.status(200).json({ carnes: pedidos, totalPages, currentPage: parseInt(page) });
    } catch (error) { 
        console.error("Erro ao buscar carnês:", error);
        res.status(500).json({ message: 'Erro ao buscar carnês em aberto.' }); 
    }
};

// ✅ NOVA FUNÇÃO PARA BUSCAR BOLETOS NEGADOS
exports.getBoletosNegados = async (req, res) => {
    try {
        const sql = `
            SELECT p.id, p.data_pedido, p.valor_total, u.nome as cliente_nome
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.status = 'Boleto Negado'
            ORDER BY p.data_pedido DESC
        `;
        const [pedidos] = await db.query(sql);
        res.status(200).json(pedidos);
    } catch (error) { 
        console.error("Erro ao buscar boletos negados:", error);
        res.status(500).json({ message: 'Erro ao buscar boletos negados.' }); 
    }
};

exports.marcarParcelaPaga = async (req, res) => {
    const { id: parcelaId } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [parcelaUpdateResult] = await connection.query("UPDATE boleto_parcelas SET status = 'pago', data_pagamento = NOW() WHERE id = ? AND status = 'pendente'", [parcelaId]);
        if (parcelaUpdateResult.affectedRows === 0) {
            throw new Error('Parcela não encontrada ou já estava paga.');
        }
        const [parcelaRows] = await connection.query('SELECT boleto_pedido_id FROM boleto_parcelas WHERE id = ?', [parcelaId]);
        const boletoPedidoId = parcelaRows[0].boleto_pedido_id;
        const [parcelasPendentes] = await connection.query("SELECT COUNT(id) as count FROM boleto_parcelas WHERE boleto_pedido_id = ? AND status = 'pendente'", [boletoPedidoId]);
        if (parcelasPendentes[0].count === 0) {
            const [pedidoRows] = await connection.query('SELECT pedido_id FROM boleto_pedidos WHERE id = ?', [boletoPedidoId]);
            const pedidoId = pedidoRows[0].pedido_id;
            await connection.query("UPDATE pedidos SET status = 'Entregue' WHERE id = ?", [pedidoId]);
        }
        await connection.commit();
        res.status(200).json({ message: 'Parcela marcada como paga com sucesso!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: `Erro ao marcar parcela como paga: ${error.message}` });
    } finally {
        connection.release();
    }
};

exports.updateDataVencimento = async (req, res) => {
    const { id: parcelaId } = req.params;
    const { novaData } = req.body;
    try {
        // Formata a data para o formato YYYY-MM-DD que o MySQL espera
        const dataFormatada = new Date(novaData).toISOString().slice(0, 10);
        await db.query('UPDATE boleto_parcelas SET data_vencimento = ? WHERE id = ?', [dataFormatada, parcelaId]);
        res.status(200).json({ message: 'Data de vencimento atualizada.' });
    } catch (error) {
        console.error("Erro ao atualizar data de vencimento:", error);
        res.status(500).json({ message: 'Erro ao atualizar data de vencimento.' });
    }
};

exports.marcarMultiplasParcelasPagas = async (req, res) => {
    const { parcelaIds } = req.body; // Espera um array de IDs: [1, 2, 3]
    if (!parcelaIds || !Array.isArray(parcelaIds) || parcelaIds.length === 0) {
        return res.status(400).json({ message: 'A lista de IDs de parcelas é obrigatória.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Atualiza todas as parcelas de uma vez
        const [updateResult] = await connection.query(
            "UPDATE boleto_parcelas SET status = 'pago', data_pagamento = NOW() WHERE id IN (?) AND status = 'pendente'",
            [parcelaIds]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error('Nenhuma parcela pendente foi encontrada para os IDs fornecidos.');
        }

        // Após pagar, verifica se o carnê foi quitado
        const [parcelaRows] = await connection.query('SELECT boleto_pedido_id FROM boleto_parcelas WHERE id = ?', [parcelaIds[0]]);
        const boletoPedidoId = parcelaRows[0].boleto_pedido_id;

        const [parcelasPendentes] = await connection.query("SELECT COUNT(id) as count FROM boleto_parcelas WHERE boleto_pedido_id = ? AND status = 'pendente'", [boletoPedidoId]);
        if (parcelasPendentes[0].count === 0) {
            const [pedidoRows] = await connection.query('SELECT pedido_id FROM boleto_pedidos WHERE id = ?', [boletoPedidoId]);
            const pedidoId = pedidoRows[0].pedido_id;
            await connection.query("UPDATE pedidos SET status = 'Entregue' WHERE id = ?", [pedidoId]);
        }

        await connection.commit();
        res.status(200).json({ message: 'Parcelas marcadas como pagas com sucesso!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: `Erro ao marcar parcelas como pagas: ${error.message}` });
    } finally {
        connection.release();
    }
};

exports.getBoletosPagos = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        let params = [];
        let whereClause = "p.forma_pagamento = 'Boleto Virtual' AND p.status = 'Entregue'";
        if (search) {
            whereClause += ' AND (u.nome LIKE ? OR u.email LIKE ? OR u.cpf LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        const countSql = `SELECT COUNT(p.id) as total FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE ${whereClause}`;
        const [countRows] = await db.query(countSql, params);
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const sql = `
            SELECT p.id, p.data_pedido, p.valor_total, u.nome as cliente_nome
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE ${whereClause}
            ORDER BY p.data_pedido DESC
            LIMIT ? OFFSET ?
        `;
        const offset = (page - 1) * limit;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const [pedidos] = await db.query(sql, finalParams);
        
        res.status(200).json({ pedidos, totalPages, currentPage: parseInt(page) });
    } catch (error) { 
        console.error("Erro ao buscar boletos pagos:", error);
        res.status(500).json({ message: 'Erro ao buscar boletos pagos.' }); 
    }
};