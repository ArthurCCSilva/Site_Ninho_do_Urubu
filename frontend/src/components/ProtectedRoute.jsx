// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, role }) {
  // ✅ 1. PEGUE O 'isLoading' JUNTO COM OS OUTROS DADOS
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  // ✅ 2. A REGRA MAIS IMPORTANTE: SE AINDA ESTIVER CARREGANDO, NÃO FAÇA NADA
  if (isLoading) {
    // Pode ser um spinner de carregamento ou simplesmente não renderizar nada
    return <div className="text-center my-5"><div className="spinner-border" /></div>;
  }

  // A partir daqui, isLoading é false, então podemos tomar uma decisão segura.

  if (!token) {
    // Se não há token, redireciona para o login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    // Se há uma role exigida e o usuário não a tem, redireciona para a Home
    return <Navigate to="/" replace />;
  }

  // Se tudo estiver ok, renderiza a página solicitada
  return children;
}

export default ProtectedRoute;