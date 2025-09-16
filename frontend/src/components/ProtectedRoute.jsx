// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  // --- LÓGICA DE ACESSO FINAL E COMPLETA ---
  
  // 1. O usuário é 'dev'? Acesso total e imediato.
  if (user.role === 'dev') {
    return children;
  }
  
  // 2. A rota exige uma 'role' e o usuário tem essa 'role'? Acesso permitido.
  if (role && user.role === role) {
    return children;
  }
  
  // 3. A rota exige uma 'permission' e o usuário tem essa permissão? Acesso permitido.
  if (permission && user.permissoes?.includes(permission)) {
    return children;
  }

  // ✅ 4. NOVA REGRA: Se a rota NÃO exige 'role' nem 'permission' específicas,
  // basta estar logado para entrar. Perfeito para as páginas de cliente!
  if (!role && !permission) {
    return children;
  }

  // 5. Se nenhuma das condições acima for atendida, o acesso é negado.
  return <Navigate to="/" replace />; 
}

export default ProtectedRoute;