// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importando componentes e páginas
import AppNavbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CustomerCartPage from './pages/CustomerCartPage';
import CustomerDashboard from './pages/CustomerDashboard';
import MinhasComandasPage from './pages/MinhasComandasPage';

// Novas páginas de Funcionário
import FuncionarioLoginPage from './pages/FuncionarioLoginPage';
import FuncionarioDashboard from './pages/FuncionarioDashboard';

// Páginas de Admin
import AdminDashboard from './pages/AdminDashboard';
import AdminOrdersPage from './pages/AdminOrdersPage';
import PhysicalSalePage from './pages/PhysicalSalePage';
import FinancialDashboardPage from './pages/FinancialDashboardPage';
import AdminCustomerInfoPage from './pages/AdminCustomerInfoPage';
import AdminBoletosPage from './pages/AdminBoletosPage';
import AdminComandaPage from './pages/AdminComandaPage';
import AdminFuncionariosPage from './pages/AdminFuncionariosPage';

// Contextos e Proteção
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FeatureFlagProvider } from './context/FeatureFlagContext';
import ProtectedRoute from './components/ProtectedRoute';
import DevDashboardPage from './pages/DevDashboardPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <FeatureFlagProvider>
          <CartProvider>
            <div className="d-flex flex-column min-vh-100">
              <AppNavbar />
              <main className="container mt-4 flex-grow-1">
                <Routes>
                  {/* --- Rotas Públicas --- */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/login-funcionario" element={<FuncionarioLoginPage />} />
                  <Route path="/produtos/:id" element={<ProductDetailPage />} />

                  {/* --- Rotas Protegidas para Clientes --- */}
                  <Route path="/carrinho" element={<ProtectedRoute><CustomerCartPage /></ProtectedRoute>} />
                  <Route path="/meus-pedidos" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
                  <Route path="/minhas-comandas" element={<ProtectedRoute><MinhasComandasPage /></ProtectedRoute>} />

                  {/* --- Rota Protegida para Funcionários --- */}
                  <Route path="/funcionario/dashboard" element={<ProtectedRoute role="funcionario"><FuncionarioDashboard /></ProtectedRoute>} />

                  {/* ✅ NOVA ROTA EXCLUSIVA PARA DEV */}
                  <Route path="/dev/dashboard" element={<ProtectedRoute role="dev"><DevDashboardPage /></ProtectedRoute>} />
                  
                  {/* --- Rotas Protegidas para Admin --- */}
                  <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/pedidos" element={<ProtectedRoute role="admin"><AdminOrdersPage /></ProtectedRoute>} />
                  <Route path="/admin/venda-fisica" element={<ProtectedRoute role="admin"><PhysicalSalePage /></ProtectedRoute>} />
                  <Route path="/admin/financeiro" element={<ProtectedRoute role="admin"><FinancialDashboardPage /></ProtectedRoute>} />
                  <Route path="/admin/clientes" element={<ProtectedRoute role="admin"><AdminCustomerInfoPage /></ProtectedRoute>} />
                  <Route path="/admin/boletos" element={<ProtectedRoute role="admin"><AdminBoletosPage /></ProtectedRoute>} />
                  <Route path="/admin/comandas" element={<ProtectedRoute role="admin"><AdminComandaPage /></ProtectedRoute>} />
                  <Route path="/admin/funcionarios" element={<ProtectedRoute role="admin"><AdminFuncionariosPage /></ProtectedRoute>} />
                </Routes>
              </main>
              <Footer />
            </div>
          </CartProvider>
        </FeatureFlagProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;