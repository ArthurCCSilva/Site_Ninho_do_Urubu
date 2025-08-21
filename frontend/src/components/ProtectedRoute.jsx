// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, role }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token) {
    // Se não há token, redireciona para o login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    // Se há uma role exigida e o usuário não a tem, redireciona
    return <Navigate to="/" replace />; // Ou para uma página "Não Autorizado"
  }

  // Se tudo estiver ok, renderiza a página solicitada
  return children;
}

export default ProtectedRoute;