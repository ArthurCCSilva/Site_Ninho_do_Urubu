// src/components/LoginForm.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function LoginForm() {
  // ✅ 1. Renomeia o estado para 'identificador'
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const [lembrarMe, setLembrarMe] = useState(false);

  useEffect(() => {
    // Verifica se há um usuário salvo no localStorage
    const usuarioSalvo = localStorage.getItem('usuarioLembrado');
    if (usuarioSalvo) {
      setIdentificador(usuarioSalvo); // Preenche o campo de usuário
      setLembrarMe(true);          // Marca o checkbox
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identificador, senha);
      
      // ✅ 3. Lógica para salvar ou remover o usuário
      if (lembrarMe) {
        // Se "Lembrar-me" estiver marcado, salva o identificador
        localStorage.setItem('usuarioLembrado', identificador);
      } else {
        // Se não, remove qualquer identificador salvo anteriormente
        localStorage.removeItem('usuarioLembrado');
      }

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
      <div className="mb-3 form-check">
        <input 
          type="checkbox" 
          className="form-check-input" 
          id="lembrarMe"
          checked={lembrarMe}
          onChange={(e) => setLembrarMe(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="lembrarMe">Lembrar-me</label>
      </div>
      <button type="submit" className="btn btn-primary w-100" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

export default LoginForm;