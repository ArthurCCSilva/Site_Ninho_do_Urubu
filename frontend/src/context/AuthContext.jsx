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

  // ✅ --- FUNÇÃO REGISTER CORRIGIDA --- ✅
  const register = async (formData) => {
    try {
      // 1. Prepara os dados para envio (incluindo o arquivo)
      const data = new FormData();
      data.append('nome', formData.nome);
      data.append('email', formData.email);
      data.append('senha', formData.senha);
      data.append('telefone', formData.telefone);
      if (formData.imagem_perfil) {
        data.append('imagem_perfil', formData.imagem_perfil);
      }

      // 2. Envia os dados para a API de registro
      await api.post('/api/auth/register', data);

      // 3. Se o cadastro funcionou, faz o login automático para o usuário
      await login(formData.email, formData.senha);

    } catch (error) {
      console.error("Falha no cadastro", error);
      // Lança o erro para que o RegisterForm.jsx possa mostrá-lo
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
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  return useContext(AuthContext);
};