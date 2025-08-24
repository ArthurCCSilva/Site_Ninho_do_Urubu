// backend/controllers/usuariosController.js
const db = require('../db');
const bcrypt = require('bcryptjs');

// ✅ FUNÇÃO ATUALIZADA para lidar com atualizações parciais
exports.updateProfile = async (req, res) => {
  const usuarioId = req.user.id;
  const { nome, email, telefone, senhaAtual, novaSenha } = req.body;
  const imagemFile = req.file;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
    if (rows.length === 0) {
      throw new Error('Usuário não encontrado.');
    }
    const usuario = rows[0];
    
    // Arrays para construir a query dinamicamente
    const updateFields = [];
    const params = [];

    // --- Verificação de cada campo ---
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
    if (imagemFile) {
      updateFields.push('imagem_perfil_url = ?');
      params.push(imagemFile.filename);
    }

    // --- Lógica segura para atualização de senha (só acontece se 'novaSenha' for fornecida) ---
    if (novaSenha) {
      if (!senhaAtual) {
        throw new Error('A senha atual é necessária para definir uma nova senha.');
      }
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash);
      if (!senhaValida) {
        throw new Error('A senha atual está incorreta.');
      }
      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
      updateFields.push('senha_hash = ?');
      params.push(novaSenhaHash);
    }

    // Se não houver nenhum campo para atualizar, apenas retorna sucesso.
    if (updateFields.length === 0) {
      await connection.commit();
      return res.status(200).json({ message: 'Nenhum dado novo para atualizar.' });
    }

    // Adiciona o ID do usuário ao final dos parâmetros para a cláusula WHERE
    params.push(usuarioId); 
    const sql = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await connection.query(sql, params);
    await connection.commit();
    
    res.status(200).json({ message: 'Perfil atualizado com sucesso!' });

  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Este e-mail já está em uso por outra conta.' });
    }
    // Retorna a mensagem de erro específica (ex: "Senha atual incorreta")
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
};