// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, role }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 1. Mantemos o spinner de carregamento enquanto o AuthContext valida o usuário.
  // Isso é crucial para evitar que a página quebre.
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  // 2. Após o carregamento, se não houver um objeto 'user',
  // o usuário não está autenticado. Redirecionamos para o login.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Se a rota exige uma permissão ('role') específica...
  if (role) {
    // ✅ LÓGICA UNIFICADA E SIMPLIFICADA:
    // Usamos diretamente 'user.role', que agora é uma string (ex: 'admin').
    
    // Regra especial: se a rota é para 'admin' e o usuário é 'dev', permite o acesso.
    if (role === 'admin' && user.role === 'dev') {
      return children; // Acesso permitido
    }

    // Regra geral: se a 'role' do usuário for diferente da exigida, nega o acesso.
    if (user.role !== role) {
      return <Navigate to="/" replace />; // Redireciona para a página inicial
    }
  }

  // 4. Se o usuário está logado e passou por todas as verificações,
  // renderiza a página solicitada.
  return children;
}

export default ProtectedRoute;