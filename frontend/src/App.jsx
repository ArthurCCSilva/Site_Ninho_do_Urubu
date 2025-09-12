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
import PhysicalSalePage from './pages/PhysicalSalePage';
import FinancialDashboardPage from './pages/FinancialDashboardPage';
import AdminCustomerInfoPage from './pages/AdminCustomerInfoPage';
import AdminBoletosPage from './pages/AdminBoletosPage';
import AdminComandaPage from './pages/AdminComandaPage';
import MinhasComandasPage from './pages/MinhasComandasPage';

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
              <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/pedidos" element={<ProtectedRoute role="admin"><AdminOrdersPage /></ProtectedRoute>} />
              <Route path="/admin/venda-fisica" element={<ProtectedRoute role="admin"><PhysicalSalePage /></ProtectedRoute>} />
              <Route path="/admin/financeiro" element={<ProtectedRoute role="admin"><FinancialDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/clientes" element={<ProtectedRoute role="admin"><AdminCustomerInfoPage /></ProtectedRoute>} />
              <Route path="/admin/boletos" element={<ProtectedRoute role="admin"><AdminBoletosPage /></ProtectedRoute>} />
              
              {/* ✅ ROTA QUE FALTAVA ADICIONADA AQUI */}
              <Route path="/admin/comandas" element={<ProtectedRoute role="admin"><AdminComandaPage /></ProtectedRoute>} />
              
              {/* --- Rotas Protegidas para Clientes --- */}
              <Route path="/carrinho" element={<ProtectedRoute><CustomerCartPage /></ProtectedRoute>} />
              <Route path="/meus-pedidos" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/minhas-comandas" element={<ProtectedRoute><MinhasComandasPage /></ProtectedRoute>} />
            </Routes>
          </main>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;