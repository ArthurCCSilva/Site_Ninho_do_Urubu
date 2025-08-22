// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// PONTO CRÍTICO #1: A variável é declarada aqui com 'A' e 'C' maiúsculos.
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
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        console.error("Token inválido", e);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } else {
      // Limpa o cabeçalho se não houver token
      api.defaults.headers.common['Authorization'] = null;
    }
  }, [token]);

  const login = async (email, senha) => {
    try {
      const response = await api.post('/api/auth/login', { email, senha });
      const newToken = response.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      const decodedUser = jwtDecode(newToken);
      if (decodedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Falha no login", error);
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      const data = new FormData();
      data.append('nome', formData.nome);
      data.append('email', formData.email);
      data.append('senha', formData.senha);
      data.append('telefone', formData.telefone);
      if (formData.imagem_perfil) {
        data.append('imagem_perfil', formData.imagem_perfil);
      }
      await api.post('/api/auth/register', data);
      await login(formData.email, formData.senha);
    } catch (error) {
      console.error("Falha no cadastro", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const authContextValue = { user, token, login, logout, register };

  return (
    // PONTO CRÍTICO #2: A variável é usada aqui com o nome idêntico.
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  // PONTO CRÍTICO #3: E usada aqui também com o nome idêntico.
  return useContext(AuthContext);
};