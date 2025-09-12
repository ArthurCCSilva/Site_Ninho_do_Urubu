// backend/controllers/comandaController.js
const db = require('../db');

exports.getAllAbertas = async (req, res) => {
    try {
        const { search } = req.query; // Pega o termo de busca da URL

        let whereClause = "WHERE c.status = 'aberta'";
        const params = [];

        if (search) {
            whereClause += " AND (u.nome LIKE ? OR c.nome_cliente_avulso LIKE ?)";
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        const sql = `
            SELECT c.id, c.data_criacao, c.nome_cliente_avulso, u.nome as cliente_nome, 
                   u.id as usuario_id, COUNT(ci.id) as total_itens, SUM(ci.quantidade * ci.preco_unitario) as valor_total
            FROM comandas c
            JOIN usuarios u ON c.usuario_id = u.id
            LEFT JOIN comanda_itens ci ON c.id = ci.comanda_id
            ${whereClause}
            GROUP BY c.id
            ORDER BY c.data_criacao DESC
        `;
        const [comandas] = await db.query(sql, params);
        res.status(200).json(comandas);
    } catch (error) { 
        console.error("Erro ao buscar comandas:", error);
        res.status(500).json({ message: 'Erro ao buscar comandas.' }); 
    }
};

exports.criarComanda = async (req, res) => {
    const { usuario_id, nome_cliente_avulso } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO comandas (usuario_id, nome_cliente_avulso) VALUES (?, ?)',
            [usuario_id, nome_cliente_avulso || null]
        );
        res.status(201).json({ message: 'Comanda aberta com sucesso!', comandaId: result.insertId });
    } catch (error) { res.status(500).json({ message: 'Erro ao criar comanda.' }); }
};

exports.getDetalhesComanda = async (req, res) => {
    try {
        const { id } = req.params;
        const [comanda] = await db.query('SELECT * FROM comandas WHERE id = ?', [id]);
        if(comanda.length === 0) return res.status(404).json({ message: 'Comanda não encontrada.' });

        const [itens] = await db.query(
            `SELECT ci.*, p.nome as produto_nome, p.imagem_produto_url 
             FROM comanda_itens ci 
             JOIN produtos p ON ci.produto_id = p.id 
             WHERE ci.comanda_id = ?`, 
            [id]
        );
        res.status(200).json({ ...comanda[0], itens });
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar detalhes da comanda.' }); }
};

exports.adicionarItem = async (req, res) => {
    const { comanda_id, produto_id, quantidade } = req.body;
    const qtdNum = parseInt(quantidade, 10);
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Verifica se há estoque para a quantidade que está sendo ADICIONADA
        const [produto] = await connection.query('SELECT valor, custo_medio_ponderado, estoque_total FROM produtos WHERE id = ?', [produto_id]);
        if (produto.length === 0) throw new Error("Produto não encontrado.");
        if (produto[0].estoque_total < qtdNum) {
            throw new Error(`Estoque insuficiente. Apenas ${produto[0].estoque_total} unidades disponíveis.`);
        }

        // 2. Verifica se o item já existe na comanda
        const [existente] = await connection.query(
            'SELECT * FROM comanda_itens WHERE comanda_id = ? AND produto_id = ?',
            [comanda_id, produto_id]
        );

        if (existente.length > 0) {
            // 3. Se existe, ATUALIZA a quantidade
            const novaQuantidade = existente[0].quantidade + qtdNum;
            await connection.query(
                'UPDATE comanda_itens SET quantidade = ? WHERE id = ?',
                [novaQuantidade, existente[0].id]
            );
        } else {
            // 4. Se não existe, INSERE o novo item
            await connection.query(
                'INSERT INTO comanda_itens (comanda_id, produto_id, quantidade, preco_unitario, custo_unitario) VALUES (?, ?, ?, ?, ?)',
                [comanda_id, produto_id, qtdNum, produto[0].valor, produto[0].custo_medio_ponderado]
            );
        }

        // 5. Dá baixa no estoque pela quantidade ADICIONADA
        await connection.query('UPDATE produtos SET estoque_total = estoque_total - ? WHERE id = ?', [qtdNum, produto_id]);
        
        await connection.commit();
        res.status(201).json({ message: 'Item adicionado com sucesso!' });
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao adicionar item à comanda:", error);
        res.status(500).json({ message: `Erro ao adicionar item: ${error.message}` });
    } finally {
        connection.release();
    }
};

exports.updateItemQuantidade = async (req, res) => {
    const { itemId } = req.params;
    const { novaQuantidade } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        if (novaQuantidade < 1) {
            await connection.rollback();
            return res.status(400).json({ message: 'Quantidade deve ser pelo menos 1. Use a opção de remover o item.' });
        }

        const [itensAtuais] = await connection.query('SELECT * FROM comanda_itens WHERE id = ?', [itemId]);
        if (itensAtuais.length === 0) throw new Error('Item da comanda não encontrado.');
        
        const item = itensAtuais[0];
        const quantidadeAntiga = item.quantidade;
        const diferencaEstoque = quantidadeAntiga - novaQuantidade;

        // Verifica se há estoque suficiente para AUMENTAR a quantidade
        if (diferencaEstoque < 0) {
            const [produto] = await connection.query('SELECT estoque_total FROM produtos WHERE id = ?', [item.produto_id]);
            if (produto[0].estoque_total < Math.abs(diferencaEstoque)) {
                throw new Error('Estoque insuficiente para adicionar a quantidade desejada.');
            }
        }
        
        // Ajusta o estoque do produto principal
        await connection.query('UPDATE produtos SET estoque_total = estoque_total + ? WHERE id = ?', [diferencaEstoque, item.produto_id]);
        
        // Atualiza a quantidade na comanda
        await connection.query('UPDATE comanda_itens SET quantidade = ? WHERE id = ?', [novaQuantidade, itemId]);

        await connection.commit();
        res.status(200).json({ message: 'Quantidade atualizada com sucesso!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: `Erro ao atualizar item: ${error.message}` });
    } finally {
        connection.release();
    }
};

// ✅ NOVA FUNÇÃO para REMOVER um item da comanda
exports.removerItem = async (req, res) => {
    const { itemId } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [itensAtuais] = await connection.query('SELECT * FROM comanda_itens WHERE id = ?', [itemId]);
        if (itensAtuais.length === 0) throw new Error('Item da comanda não encontrado.');

        const item = itensAtuais[0];
        
        // Devolve a quantidade do item removido ao estoque
        await connection.query('UPDATE produtos SET estoque_total = estoque_total + ? WHERE id = ?', [item.quantidade, item.produto_id]);

        // Remove o item da comanda
        await connection.query('DELETE FROM comanda_itens WHERE id = ?', [itemId]);

        await connection.commit();
        res.status(200).json({ message: 'Item removido da comanda com sucesso!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: `Erro ao remover item: ${error.message}` });
    } finally {
        connection.release();
    }
};

exports.fecharComanda = async (req, res) => {
    const { comandaId } = req.params;
    const { forma_pagamento, valor_pago_cliente } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [comandas] = await connection.query(`SELECT c.*, u.nome as cliente_nome, u.id as usuario_id FROM comandas c JOIN usuarios u ON c.usuario_id = u.id WHERE c.id = ? AND c.status = 'aberta' FOR UPDATE`, [comandaId]);
        if (comandas.length === 0) throw new Error('Comanda não encontrada ou já está fechada.');
        const comanda = comandas[0];

        const [itens] = await connection.query('SELECT * FROM comanda_itens WHERE comanda_id = ?', [comandaId]);
        if (itens.length === 0) throw new Error('Não é possível fechar uma comanda sem itens.');

        const valorTotal = itens.reduce((acc, item) => acc + (parseFloat(item.preco_unitario) * item.quantidade), 0);

        // ✅ LÓGICA CORRIGIDA: Define o status e data de entrega com base na forma de pagamento
        const statusFinal = forma_pagamento === 'Fiado' ? 'Fiado' : 'Entregue';
        const queryDataEntrega = forma_pagamento === 'Fiado' ? 'NULL' : 'NOW()';

        const sqlPedido = `
            INSERT INTO pedidos (usuario_id, valor_total, forma_pagamento, local_entrega, valor_pago_cliente, status, data_entrega) 
            VALUES (?, ?, ?, ?, ?, ?, ${queryDataEntrega})
        `;
        const [resultadoPedido] = await connection.query(sqlPedido,
            [comanda.usuario_id, valorTotal, forma_pagamento, comanda.nome_cliente_avulso || 'Consumo no local', valor_pago_cliente || null, statusFinal]
        );
        const pedidoId = resultadoPedido.insertId;

        for (const item of itens) {
            await connection.query(
                'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, custo_unitario) VALUES (?, ?, ?, ?, ?)',
                [pedidoId, item.produto_id, item.quantidade, item.preco_unitario, item.custo_unitario]
            );
        }

        await connection.query("UPDATE comandas SET status = 'fechada' WHERE id = ?", [comandaId]);

        await connection.commit();
        res.status(201).json({ message: `Comanda fechada com sucesso! Pedido #${pedidoId} gerado.` });
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao fechar comanda:", error);
        res.status(500).json({ message: `Erro ao fechar comanda: ${error.message}` });
    } finally {
        connection.release();
    }
};