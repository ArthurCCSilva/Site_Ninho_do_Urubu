// src/components/RegisterForm.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PhoneInput from 'react-phone-number-input';
import { InputMask } from '@react-input/mask';
import 'react-phone-number-input/style.css';
import { useNavigate } from 'react-router-dom';

function RegisterForm() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cpf: ''
  });
  const [telefone, setTelefone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [imagemFile, setImagemFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setImagemFile(e.target.files[0]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.senha !== formData.confirmarSenha) { return setError('As senhas não coincidem.'); }
    if (!telefone) { return setError('O número de WhatsApp é obrigatório.'); }
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) { return setError('Por favor, insira um CPF válido.'); }
    
    setLoading(true);
    const data = new FormData();
    data.append('nome', formData.nome);
    data.append('email', formData.email);
    data.append('senha', formData.senha);
    data.append('telefone', telefone);
    data.append('cpf', formData.cpf);
    if (imagemFile) {
      data.append('imagem_perfil', imagemFile);
    }

    try {
      await register(data);
      setSuccess('Cadastro realizado com sucesso! Redirecionando...');
      
      // ✅ CORREÇÃO: O redirecionamento é feito aqui, DENTRO do formulário
      setTimeout(() => {
        // Recarrega a página de login para que a mensagem de sucesso desapareça
        window.location.href = '/login'; 
      }, 1500);

    } catch(err) {
      setError(err.response?.data?.message || 'Falha no cadastro. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="mb-3"><label className="form-label">Nome Completo</label><input type="text" name="nome" className="form-control" placeholder="Seu nome" value={formData.nome} onChange={handleChange} required /></div>
      <div className="mb-3"><label className="form-label">Email (Opcional)</label><input type="email" name="email" className="form-control" placeholder="seu@email.com" value={formData.email} onChange={handleChange} /></div>
      <div className="mb-3"><label className="form-label">WhatsApp</label><PhoneInput placeholder="(00) 0 0000-0000" value={telefone} onChange={setTelefone} defaultCountry="BR" className="form-control" required /></div>
      <div className="mb-3"><label className="form-label">CPF</label><InputMask mask="___.___.___-__" replacement={{ _: /\d/ }} value={formData.cpf} onChange={handleChange} name="cpf" className="form-control" placeholder="000.000.000-00" required /></div>
      <div className="mb-3 position-relative">
        <label className="form-label">Senha</label>
        <input type={showPassword ? 'text' : 'password'} name="senha" className="form-control" placeholder="Crie uma senha" value={formData.senha} onChange={handleChange} required />
        <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '38px', cursor: 'pointer' }}><i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i></span>
      </div>
      <div className="mb-3"><label className="form-label">Confirmar Senha</label><input type={showPassword ? 'text' : 'password'} name="confirmarSenha" className="form-control" placeholder="Digite a senha novamente" value={formData.confirmarSenha} onChange={handleChange} required /></div>
      <div className="mb-3"><label className="form-label">Foto de Perfil (Opcional)</label><input type="file" name="imagem_perfil" className="form-control" onChange={handleFileChange} accept="image/*" /></div>
      <button type="submit" className="btn btn-success w-100" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
    </form>
  );
}

export default RegisterForm;