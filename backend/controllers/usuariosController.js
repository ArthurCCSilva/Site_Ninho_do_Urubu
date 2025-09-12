// backend/controllers/usuariosController.js
const db = require('../db');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises; // Importa o módulo File System (para apagar arquivos)
const path = require('path');     // Importa o módulo Path (para criar caminhos de arquivo seguros)

// FUNÇÃO ATUALIZADA para deletar a foto de perfil antiga ao trocar
exports.updateProfile = async (req, res) => {
  const usuarioId = req.user.id;
  const { nome, email, telefone, senhaAtual, novaSenha } = req.body;
  const imagemFile = req.file;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Busca o usuário atual para pegar informações antigas (como a URL da imagem)
    const [rows] = await connection.query('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
    if (rows.length === 0) { 
      throw new Error('Usuário não encontrado.'); 
    }
    const usuario = rows[0];
    const imagemAntiga = usuario.imagem_perfil_url; // Guarda o nome do arquivo da imagem antiga
    
    const updateFields = [];
    const params = [];

    // --- Lógica de atualização individual ---
    if (nome && nome !== usuario.nome) { 
      updateFields.push('nome = ?'); 
      params.push(nome); 
    }
    if (email && email !== usuario.email) { 
      updateFields.push('email = ?'); 
      params.push(email); 
    }
    if (telefone) {
      const telefoneSanitizado = telefone.replace(/\D/g, '');
      if (telefoneSanitizado !== usuario.telefone) {
        updateFields.push('telefone = ?');
        params.push(telefoneSanitizado);
      }
    }
    
    // Lógica para atualização de senha
    if (novaSenha) {
      if (!senhaAtual) { throw new Error('A senha atual é necessária para definir uma nova senha.'); }
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash);
      if (!senhaValida) { throw new Error('A senha atual está incorreta.'); }
      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
      updateFields.push('senha_hash = ?');
      params.push(novaSenhaHash);
    }

    // Lógica para atualização da imagem no banco de dados
    if (imagemFile) {
      updateFields.push('imagem_perfil_url = ?');
      params.push(imagemFile.filename);
    }

    // Apenas executa a query se houver campos para atualizar
    if (updateFields.length > 0) {
      params.push(usuarioId);
      const sql = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?`;
      await connection.query(sql, params);
    }
    
    await connection.commit(); // Confirma as alterações no banco

    // --- Lógica para apagar o arquivo antigo do disco ---
    // Isso acontece DEPOIS que o banco de dados foi atualizado com sucesso
    if (imagemFile && imagemAntiga) {
      // ✅ CORREÇÃO DO CAMINHO AQUI
      const caminhoImagemAntiga = path.join(__dirname, '..', 'uploads', imagemAntiga);
      try {
        await fs.unlink(caminhoImagemAntiga);
        console.log(`Foto de perfil antiga ${imagemAntiga} deletada.`);
      } catch (fileErr) {
        console.error("Erro ao deletar foto de perfil antiga:", fileErr.code);
      }
    }
    
    res.status(200).json({ message: 'Perfil atualizado com sucesso!' });

  } catch (error) {
    await connection.rollback(); // Desfaz tudo se der algum erro
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Este e-mail já está em uso.' });
    }
    res.status(400).json({ message: error.message });
  } finally {
    connection.release(); // Sempre libera a conexão no final
  }
};

exports.getAllClientes = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query; 
    
    let params = [];
    let whereConditions = "role = 'cliente'";

    // Se houver um termo de busca, agora ele procura em 3 colunas
    if (search) {
      whereConditions += ' AND (id = ? OR nome LIKE ? OR email LIKE ? OR telefone LIKE ? OR cpf LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(search, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Contagem para paginação (mantida por consistência)
    const countSql = `SELECT COUNT(id) as total FROM usuarios WHERE ${whereConditions}`;
    const [countRows] = await db.query(countSql, params);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Busca dos dados paginados
    const offset = (page - 1) * limit;
    const finalParams = [...params, parseInt(limit), parseInt(offset)];
    const sql = `SELECT id, nome, email, telefone, cpf, imagem_perfil_url FROM usuarios WHERE ${whereConditions} ORDER BY nome ASC LIMIT ? OFFSET ?`;
    
    const [clientes] = await db.query(sql, finalParams);
    res.status(200).json({ clientes, totalPages, currentPage: parseInt(page) });

  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    res.status(500).json({ message: 'Erro ao buscar clientes.', error: error.message });
  }
};

// ✅ NOVA FUNÇÃO SEGURA para o Admin editar um usuário
exports.adminUpdateUsuario = async (req, res) => {
    const { id } = req.params; // ID do usuário a ser editado
    const { telefone, senha } = req.body;

    if (!telefone && !senha) {
        return res.status(400).json({ message: 'Pelo menos um campo (telefone ou senha) deve ser fornecido.' });
    }

    try {
        let updateFields = [];
        const params = [];

        if (telefone) {
            updateFields.push('telefone = ?');
            params.push(telefone.replace(/\D/g, ''));
        }
        if (senha) {
            const senhaHash = await bcrypt.hash(senha, 10);
            updateFields.push('senha_hash = ?');
            params.push(senhaHash);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'Nenhum dado válido para atualizar.' });
        }

        params.push(id);
        const sql = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?`;
        
        await db.query(sql, params);

        res.status(200).json({ message: 'Dados do cliente atualizados com sucesso!' });
    } catch (error) {
        console.error("Erro ao atualizar dados do usuário pelo admin:", error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar dados.' });
    }
};

exports.getStatusFinanceiro = async (req, res) => {
    const { id: usuarioId } = req.params;
    try {
        const [fiados] = await db.query("SELECT COUNT(id) as count FROM pedidos WHERE usuario_id = ? AND status = 'Fiado'", [usuarioId]);
        const [boletos] = await db.query("SELECT COUNT(id) as count FROM pedidos WHERE usuario_id = ? AND status = 'Boleto em Pagamento'", [usuarioId]);
        res.status(200).json({
            temFiado: fiados[0].count > 0,
            temBoleto: boletos[0].count > 0
        });
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar status financeiro.' }); }
};

// ✅ NOVA FUNÇÃO: Busca todos os pedidos fiado de um cliente
exports.getPedidosFiado = async (req, res) => {
    const { id: usuarioId } = req.params;
    try {
        const [pedidos] = await db.query("SELECT * FROM pedidos WHERE usuario_id = ? AND status = 'Fiado' ORDER BY data_pedido ASC", [usuarioId]);
        
        // Para cada pedido fiado, busca seus pagamentos parciais
        for (const pedido of pedidos) {
            const [pagamentos] = await db.query(
                'SELECT * FROM pagamentos_fiado WHERE pedido_id = ?', 
                [pedido.id]
            );
            pedido.pagamentos_fiado = pagamentos; // Anexa os pagamentos ao objeto do pedido
        }
        
        res.status(200).json(pedidos);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar pedidos fiado.' }); }
};

// ✅ NOVA FUNÇÃO: Processa o pagamento em lote (FIFO)
exports.pagarFiadoTotal = async (req, res) => {
    const { id: usuarioId } = req.params;
    let { valor_pago } = req.body;
    let valorPagoNumerico = parseFloat(String(valor_pago).replace(',', '.'));
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const [pedidosFiado] = await connection.query("SELECT * FROM pedidos WHERE usuario_id = ? AND status = 'Fiado' ORDER BY data_pedido ASC FOR UPDATE", [usuarioId]);
        
        for (const pedido of pedidosFiado) {
            if (valorPagoNumerico <= 0) break;

            const [pagamentosAnteriores] = await connection.query('SELECT SUM(valor_pago) as total FROM pagamentos_fiado WHERE pedido_id = ?', [pedido.id]);
            const saldoDevedorPedido = parseFloat(pedido.valor_total) - (parseFloat(pagamentosAnteriores[0].total) || 0);

            const valorAPagarNestePedido = Math.min(valorPagoNumerico, saldoDevedorPedido);

            if (valorAPagarNestePedido > 0) {
                await connection.query('INSERT INTO pagamentos_fiado (pedido_id, valor_pago, data_pagamento) VALUES (?, ?, NOW())', [pedido.id, valorAPagarNestePedido]);
                valorPagoNumerico -= valorAPagarNestePedido;
            }

            const novoTotalPago = (parseFloat(pagamentosAnteriores[0].total) || 0) + valorAPagarNestePedido;
            if (novoTotalPago >= parseFloat(pedido.valor_total)) {
                await connection.query("UPDATE pedidos SET status = 'Entregue' WHERE id = ?", [pedido.id]);
            }
        }
        await connection.commit();
        res.status(200).json({ message: 'Pagamento de fiado registrado com sucesso!' });
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao pagar fiado total:", error);
        res.status(500).json({ message: `Erro ao registrar pagamento: ${error.message}` });
    } finally {
        connection.release();
    }
};

exports.getMinhasComandas = async (req, res) => {
    const usuarioId = req.user.id;
    try {
        const sql = `
            SELECT c.id, c.data_criacao, COUNT(ci.id) as total_itens, 
                   SUM(ci.quantidade * ci.preco_unitario) as valor_total
            FROM comandas c
            LEFT JOIN comanda_itens ci ON c.id = ci.comanda_id
            WHERE c.usuario_id = ? AND c.status = 'aberta'
            GROUP BY c.id
            ORDER BY c.data_criacao DESC
        `;
        const [comandas] = await db.query(sql, [usuarioId]);

        // Para cada comanda, busca os seus itens
        for (const comanda of comandas) {
            const [itens] = await db.query(
                `SELECT ci.quantidade, ci.preco_unitario, p.nome as produto_nome, p.imagem_produto_url 
                 FROM comanda_itens ci 
                 JOIN produtos p ON ci.produto_id = p.id 
                 WHERE ci.comanda_id = ?`, 
                [comanda.id]
            );
            comanda.itens = itens;
        }

        res.status(200).json(comandas);
    } catch (error) {
        console.error("Erro ao buscar comandas do usuário:", error);
        res.status(500).json({ message: 'Erro ao buscar suas comandas.' });
    }
};