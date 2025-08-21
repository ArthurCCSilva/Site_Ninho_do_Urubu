// src/components/RegisterForm.jsx
import { useState } from 'react';
// Futuramente, importaremos o useAuth aqui também
// import { useAuth } from '../context/AuthContext';

function RegisterForm() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
  });
  const [error, setError] = useState('');
  // const { register } = useAuth(); // Descomentaremos isso depois

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.nome || !formData.email || !formData.senha || !formData.telefone) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    console.log('Tentando registrar com:', formData);
    // try {
    //   await register(formData);
    // } catch(err) {
    //   setError('Falha no cadastro. Tente novamente.');
    // }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      
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

      <button type="submit" className="btn btn-success w-100">
        Cadastrar
      </button>
    </form>
  );
}

export default RegisterForm;