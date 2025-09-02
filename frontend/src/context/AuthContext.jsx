// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
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

  // ✅ CORREÇÃO: A função register agora só faz a chamada à API.
  const register = useCallback(async (formData) => {
    try {
      await api.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error("Falha no cadastro", error);
      throw error; // Lança o erro para o formulário tratar
    }
  }, []); // 'navigate' não é mais uma dependência

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const authContextValue = useMemo(() => ({
    user,
    token,
    isLoading,
    login,
    logout,
    register
    // O estado 'registrationSuccess' foi removido daqui
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