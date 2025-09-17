// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/api/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Token inválido. Fazendo logout.", error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, [token]);

  // ✅ FUNÇÃO DE LOGIN SIMPLIFICADA
  // A responsabilidade dela agora é apenas obter e salvar o token.
  const login = useCallback(async (identificador, senha) => {
    try {
      const response = await api.post('/api/auth/login', { identificador, senha });
      const newToken = response.data.token;
      localStorage.setItem('token', newToken);
      // Ao definir o token, o useEffect acima será disparado para carregar o usuário,
      // e o useEffect abaixo cuidará do redirecionamento.
      setToken(newToken);
    } catch (error) {
      console.error("Falha no login", error);
      throw error;
    }
  }, []);
  
  // ✅ NOVA LÓGICA DE REDIRECIONAMENTO INTELIGENTE
  // Este useEffect reage à mudança no 'user' e no 'isLoading'
  useEffect(() => {
    if (!isLoading && user) {
      // Redireciona apenas se o usuário acabou de logar (ou seja, se ele está na página de login)
      if (location.pathname === '/login') {
        const userRole = user.role;
        if (userRole === 'dev') {
          navigate('/dev/dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else if (userRole === 'funcionario') {
          navigate('/funcionario/dashboard');
        } else {
          // Para clientes, redireciona para a home
          navigate('/');
        }
      }
    }
  }, [user, isLoading, navigate, location.pathname]);


  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    api.defaults.headers.common['Authorization'] = null;
    navigate('/login');
  }, [navigate]);
  
  // A função register não foi incluída aqui por brevidade, mas deve ser mantida no seu arquivo
  const register = useCallback(async (formData) => {
  try {
    const response = await api.post('/api/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // ✅ Em caso de sucesso, retorna os dados da resposta (importante!)
    return response.data; 
  } catch (error) {
    console.error("Falha no cadastro no contexto:", error);
    // Lança o erro para o formulário poder pegá-lo
    throw error;
  }
}, []);

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