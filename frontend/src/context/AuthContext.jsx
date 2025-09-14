// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 1. CARREGAMENTO INICIAL DO USUÁRIO
  // Este useEffect roda uma vez quando a página carrega para verificar se já existe um token.
  useEffect(() => {
    const loadUserFromToken = async () => {
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/api/auth/me');
          setUser(response.data); // Salva o usuário completo com permissões
        } catch (error) {
          console.error("Token inválido, limpando...", error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    loadUserFromToken();
  }, [token]); // Roda sempre que o token mudar

  // 2. FUNÇÃO DE LOGIN
  // Simplificada para ser direta e clara, como na versão antiga.
  const login = useCallback(async (identificador, senha) => {
    try {
      const response = await api.post('/api/auth/login', { identificador, senha });
      const newToken = response.data.token;
      
      // Decodificamos o token SIMPLES para o redirecionamento imediato
      const decodedUser = jwtDecode(newToken);
      
      localStorage.setItem('token', newToken);
      // Ao definir o token, o useEffect acima será disparado para buscar os dados completos
      setToken(newToken); 
      
      // LÓGICA DE REDIRECIONAMENTO IMEDIATO (como era antes)
      const userRole = decodedUser.role; // ex: 'admin', 'dev'
      if (userRole === 'dev') {
        navigate('/dev/dashboard');
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'funcionario') {
        navigate('/funcionario/dashboard');
      } else {
        // Redirecionamento padrão para clientes
        navigate('/meus-pedidos'); 
      }
    } catch (error) {
      console.error("Falha no login", error);
      throw error;
    }
  }, [navigate]);

  const register = useCallback(async (formData) => {
    // ...função register permanece a mesma...
    try {
      await api.post('/api/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) {
      console.error("Falha no cadastro", error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    // ...função logout permanece a mesma...
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    api.defaults.headers.common['Authorization'] = null;
    navigate('/login');
  }, [navigate]);

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
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};