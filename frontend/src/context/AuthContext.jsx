// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  
  // ✅ 1. ESTADO DE CARREGAMENTO ESSENCIAL
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        console.error("Token inválido, limpando...", e);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } else {
      api.defaults.headers.common['Authorization'] = null;
    }
    // ✅ 2. SINALIZA QUE A VERIFICAÇÃO INICIAL TERMINOU
    setIsLoading(false);
  }, [token]);

  const login = useCallback(async (identificador, senha) => {
    try {
      const response = await api.post('/api/auth/login', { identificador, senha });
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
  }, [navigate]);

  const register = useCallback(async (formData) => {
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
      await login(formData.telefone, formData.senha);
    } catch (error) {
      console.error("Falha no cadastro", error);
      throw error;
    }
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // ✅ 3. useMemo PARA GARANTIR QUE O OBJETO DO CONTEXTO SEJA ESTÁVEL
  const authContextValue = useMemo(() => ({
    user,
    token,
    isLoading,
    login,
    logout,
    register
  }), [user, token, isLoading, login, logout, register]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};