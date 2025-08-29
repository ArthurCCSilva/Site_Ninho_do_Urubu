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
    const [clientes] = await db.query(
      "SELECT id, nome, email FROM usuarios WHERE role = 'cliente' ORDER BY nome ASC"
    );
    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar clientes.', error: error.message });
  }
};