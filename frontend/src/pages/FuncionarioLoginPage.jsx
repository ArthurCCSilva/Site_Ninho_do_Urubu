// src/pages/FuncionarioLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Certifique-se que o caminho está correto
import { useAuth } from '../context/AuthContext'; // Certifique-se que o caminho está correto

function FuncionarioLoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Função de login do AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!usuario || !senha) {
      setError("Por favor, preencha todos os campos.");
      setLoading(false);
      return;
    }

    try {
      // ✅ Endpoint de login para funcionários (ajuste se seu backend for diferente)
      const response = await api.post('/auth/login/employee', { usuario, senha }); 
      
      // Assumindo que a API retorna o token e os dados do usuário
      const { token, user } = response.data; 

      // Salvar os dados do usuário e token no contexto de autenticação
      login(token, user); 
      
      // ✅ Redirecionar para o painel de administração ou para uma rota específica de funcionário
      // Ajuste a rota para onde os funcionários devem ser redirecionados após o login
      navigate('/admin/dashboard'); 

    } catch (err) {
      console.error("Erro ao fazer login do funcionário:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Erro ao fazer login. Verifique suas credenciais.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-lg p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Login do Funcionário</h2>
          
          {error && <div className="alert alert-danger text-center">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="usuario" className="form-label">Usuário</label>
              <input
                type="text"
                className="form-control"
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="senha" className="form-label">Senha</label>
              <input
                type="password"
                className="form-control"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="d-grid">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
          </form>
          <div className="text-center mt-3">
            <button 
                className="btn btn-link" 
                onClick={() => navigate('/login')} // ✅ Ajuste para a rota de login de cliente se necessário
                disabled={loading}
            >
                Voltar para Login do Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ Garante que o componente é exportado como default
export default FuncionarioLoginPage;