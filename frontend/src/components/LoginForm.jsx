// src/components/LoginForm.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function LoginForm() {
  // ✅ 1. Renomeia o estado para 'identificador'
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // ✅ 2. Passa 'identificador' para a função de login
      await login(identificador, senha);
    } catch (err) {
      setError('Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="mb-3">
        {/* ✅ 3. ATUALIZA a label e o placeholder */}
        <label htmlFor="identificador" className="form-label">Email ou Telefone</label>
        <input 
          type="text" 
          id="identificador"
          className="form-control" 
          placeholder="Digite seu email ou telefone"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          required 
        />
      </div>
      <div className="mb-3">
        <label htmlFor="senha" className="form-label">Senha</label>
        <input 
          type="password" 
          id="senha"
          className="form-control" 
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required 
        />
      </div>
      <button type="submit" className="btn btn-primary w-100" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

export default LoginForm;