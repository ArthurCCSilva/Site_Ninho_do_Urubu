// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        // Configura o token no cabeçalho de todas as requisições do axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        console.error("Token inválido", e);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    }
  }, [token]);

  const login = async (email, senha) => {
    try {
      const response = await api.post('/api/auth/login', { email, senha });
      const newToken = response.data.token;

      localStorage.setItem('token', newToken);
      setToken(newToken); // Isso vai disparar o useEffect

      const decodedUser = jwtDecode(newToken);

      // Redireciona com base no cargo (role)
      if (decodedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Falha no login", error);
      throw error; // Lança o erro para ser tratado no formulário
    }
  };

  const register = async (userData) => {
    // Implementação do registro virá aqui depois
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    api.defaults.headers.common['Authorization'] = null;
    navigate('/login');
  };

  const authContextValue = { user, token, login, logout, register };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  return useContext(AuthContext);
};