// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // ✅ 1. ADICIONA O ESTADO DE CARREGAMENTO, INICIANDO COMO 'true'
  const [isLoading, setIsLoading] = useState(true);

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
      api.defaults.headers.common['Authorization'] = null;
    }
    
    // ✅ 2. AO FINAL DA VERIFICAÇÃO, DEFINE O CARREGAMENTO COMO 'false'
    //    Isso sinaliza para o resto da aplicação que a checagem inicial terminou.
    setIsLoading(false); 
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

  // ✅ 3. EXPÕE A VARIÁVEL 'isLoading' NO VALOR DO CONTEXTO
  const authContextValue = { user, token, isLoading, login, logout, register };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};