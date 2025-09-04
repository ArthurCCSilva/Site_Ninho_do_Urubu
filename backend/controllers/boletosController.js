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
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar boletos para aprovação.' }); }
};

exports.getParcelasEmAberto = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        let params = [];
        let whereClause = "bp.status = 'pendente'";
        if (search) {
            whereClause += ' AND (u.nome LIKE ? OR u.email LIKE ? OR u.cpf LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        const countSql = `SELECT COUNT(bp.id) as total FROM boleto_parcelas bp JOIN boleto_pedidos b ON bp.boleto_pedido_id = b.id JOIN pedidos p ON b.pedido_id = p.id JOIN usuarios u ON p.usuario_id = u.id WHERE ${whereClause}`;
        const [countRows] = await db.query(countSql, params);
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const sql = `
            SELECT bp.*, p.id as pedido_id, p.valor_total, u.nome as cliente_nome, u.imagem_perfil_url
            FROM boleto_parcelas bp
            JOIN boleto_pedidos b ON bp.boleto_pedido_id = b.id
            JOIN pedidos p ON b.pedido_id = p.id
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE ${whereClause}
            ORDER BY bp.data_vencimento ASC
            LIMIT ? OFFSET ?
        `;
        const offset = (page - 1) * limit;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const [parcelas] = await db.query(sql, finalParams);
        res.status(200).json({ parcelas, totalPages, currentPage: parseInt(page) });
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar parcelas em aberto.' }); }
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