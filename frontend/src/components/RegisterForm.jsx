// src/components/RegisterForm.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PhoneInput from 'react-phone-number-input'; // 1. Importa o componente de telefone

function RegisterForm() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
  });
  // 2. Cria um estado separado para o telefone
  const [telefone, setTelefone] = useState('');
  
  const [confirmSenha, setConfirmSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [imagemFile, setImagemFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setImagemFile(e.target.files[0]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.senha !== confirmSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    // 3. Inclui o 'telefone' na validação e nos dados a serem enviados
    if (!formData.nome || !formData.email || !formData.senha || !telefone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    try {
      const fullFormData = { ...formData, telefone, imagem_perfil: imagemFile };
      await register(fullFormData);
      setSuccess('Cadastro realizado com sucesso! Redirecionando...');
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
        <input type="text" name="nome" className="form-control" placeholder="Seu nome" onChange={handleChange} required />
      </div>
      <div className="mb-3">
        <label className="form-label">Email</label>
        <input type="email" name="email" className="form-control" placeholder="seu@email.com" onChange={handleChange} required />
      </div>
      
      {/* 4. SUBSTITUI o input de telefone antigo pelo novo componente */}
      <div className="mb-3">
          <label className="form-label">telefone - WhatsApp</label>
          <PhoneInput
            placeholder="12345678999"
            value={telefone}
            onChange={setTelefone}
            defaultCountry="BR" // País padrão
            className="form-control"
            required
          />
      </div>
      
      <div className="mb-3 position-relative">
        <label className="form-label">Senha</label>
        <input type={showPassword ? 'text' : 'password'} name="senha" className="form-control" placeholder="Crie uma senha" onChange={handleChange} required />
        <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '38px', cursor: 'pointer' }}>
          <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
        </span>
      </div>
      
      <div className="mb-3">
        <label className="form-label">Confirmar Senha</label>
        <input type={showPassword ? 'text' : 'password'} name="confirmSenha" className="form-control" placeholder="Digite a senha novamente" onChange={(e) => setConfirmSenha(e.target.value)} required />
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