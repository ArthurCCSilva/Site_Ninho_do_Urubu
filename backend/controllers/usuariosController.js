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