// src/components/RegisterForm.jsx
import { useState } from 'react';
// 1. Descomente a importação do useAuth
import { useAuth } from '../context/AuthContext'; 

function RegisterForm() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
  });
  const [imagemFile, setImagemFile] = useState(null); // Estado para o arquivo de imagem
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // 2. Descomente para pegar a função register do contexto
  const { register } = useAuth(); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImagemFile(e.target.files[0]);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.nome || !formData.email || !formData.senha || !formData.telefone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    // 3. Reative o bloco try...catch para enviar os dados
    try {
      const fullFormData = { ...formData, imagem_perfil: imagemFile };
      await register(fullFormData); // A chamada para a função de registro agora está ativa
      setSuccess('Cadastro realizado com sucesso! Redirecionando...');
      // O redirecionamento é feito pela função 'login' que é chamada dentro de 'register'
    } catch(err) {
      setError(err.response?.data?.message || 'Falha no cadastro. Tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="mb-3">
        <label className="form-label">Nome Completo</label>
        <input type="text" name="nome" className="form-control" placeholder="Seu nome" onChange={handleChange} />
      </div>

      <div className="mb-3">
        <label className="form-label">Email</label>
        <input type="email" name="email" className="form-control" placeholder="seu@email.com" onChange={handleChange} />
      </div>

      <div className="mb-3">
        <label className="form-label">Telefone</label>
        <input type="text" name="telefone" className="form-control" placeholder="(XX) XXXXX-XXXX" onChange={handleChange} />
      </div>
      
      <div className="mb-3">
        <label className="form-label">Senha</label>
        <input type="password" name="senha" className="form-control" placeholder="Crie uma senha" onChange={handleChange} />
      </div>
      
      <div className="mb-3">
        <label className="form-label">Foto de Perfil (Opcional)</label>
        <input type="file" name="imagem_perfil" className="form-control" onChange={handleFileChange} />
      </div>

      <button type="submit" className="btn btn-success w-100">
        Cadastrar
      </button>
    </form>
  );
}

export default RegisterForm;