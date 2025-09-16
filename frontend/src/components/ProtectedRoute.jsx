// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Versão final que aceita 'role' E/OU 'permission'
function ProtectedRoute({ children, role, permission }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // NOVA LÓGICA DE ACESSO
  
  // 1. O usuário é 'dev'? Acesso total e imediato.
  if (user.role === 'dev') {
    return children;
  }
  
  // 2. A rota exige uma 'role' e o usuário tem essa 'role'? Acesso permitido.
  // (Ex: Rota exige 'admin', e o usuário é 'admin')
  if (role && user.role === role) {
    return children;
  }
  
  // 3. A rota exige uma 'permission' e o usuário tem essa permissão no seu array? Acesso permitido.
  // (Ex: Rota exige 'admin_gerenciar_comandas' e o funcionário tem essa permissão)
  if (permission && user.permissoes?.includes(permission)) {
    return children;
  }

  // 4. Se nenhuma das condições acima for atendida, o acesso é negado.
  console.log(`Acesso negado para a rota ${location.pathname}. Usuário:`, user);
  return <Navigate to="/" replace />; 
}

export default ProtectedRoute;