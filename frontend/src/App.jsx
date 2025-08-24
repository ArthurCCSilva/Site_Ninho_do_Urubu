// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importando nossos componentes e páginas
import AppNavbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrdersPage from './pages/AdminOrdersPage';
import CustomerCartPage from './pages/CustomerCartPage';

// Importando os Provedores de Contexto e Componentes de Rota
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerDashboard from './pages/CustomerDashboard';
import ProductDetailPage from './pages/ProductDetailPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppNavbar />
          <main className="container mt-4">
            <Routes>
              {/* --- Rotas Públicas --- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route path="/produtos/:id" element={<ProductDetailPage />} />
              
              {/* --- Rotas Protegidas para Admin --- */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* ✅ ROTA DE PEDIDOS DO ADMIN ADICIONADA */}
              <Route 
                path="/admin/pedidos" 
                element={
                  <ProtectedRoute role="admin">
                    <AdminOrdersPage />
                  </ProtectedRoute>
                } 
              />

              {/* --- Rota Protegida para Usuários Logados (Qualquer Role) --- */}
              {/* ✅ ROTA DO CARRINHO ADICIONADA */}
              <Route 
                path="/carrinho" 
                element={
                  <ProtectedRoute> {/* Sem a prop 'role', apenas verifica se o usuário está logado */}
                    <CustomerCartPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* ✅ NOVA ROTA PARA O PAINEL DO CLIENTE */}
              <Route
                path="/meus-pedidos"
                element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>}
              />
              
            </Routes>
          </main>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;