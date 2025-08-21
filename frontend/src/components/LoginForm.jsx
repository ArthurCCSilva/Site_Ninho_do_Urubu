// src/components/LoginForm.jsx
import { useState } from "react";
import { useAuth } from '../context/AuthContext'; // Importe nosso hook de autenticação

function LoginForm() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth(); // Pegue a função login do contexto

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    try {
      await login(email, senha); // Use a função de login do contexto!
    } catch (err) {
      setError('Falha no login. Verifique seu email e senha.');
    }
  };

  return (
    // A tag <form> continua a mesma
    <form onSubmit={handleSubmit}>
      {/* O componente <Alert> vira uma <div> com classes do Bootstrap */}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* O <Form.Group> vira uma <div> com a classe de margem 'mb-3' */}
      <div className="mb-3">
        <label htmlFor="loginEmail" className="form-label">Email</label>
        <input 
          type="email" 
          className="form-control"
          id="loginEmail"
          placeholder="Digite seu email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="loginPassword"  className="form-label">Senha</label>
        <input 
          type="password" 
          className="form-control"
          id="loginPassword"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      {/* O <Button> vira uma tag <button> com classes de botão do Bootstrap */}
      <button type="submit" className="btn btn-primary w-100">
        Entrar
      </button>
    </form>
  );
}

export default LoginForm;