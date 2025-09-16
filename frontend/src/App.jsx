// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importando componentes e páginas
import Navbar from './components/Navbar'; // Nome corrigido para Navbar
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CustomerCartPage from './pages/CustomerCartPage';
import CustomerDashboard from './pages/CustomerDashboard';
import MinhasComandasPage from './pages/MinhasComandasPage';

// Páginas de Funcionário
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
              <Navbar />
              <main className="container mt-4 flex-grow-1">
                <Routes>
                  {/* --- Rotas Públicas --- */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/produtos/:id" element={<ProductDetailPage />} />

                  {/* --- Rotas Protegidas para Clientes --- */}
                  <Route path="/carrinho" element={<ProtectedRoute><CustomerCartPage /></ProtectedRoute>} />
                  <Route path="/meus-pedidos" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
                  <Route path="/minhas-comandas" element={<ProtectedRoute><MinhasComandasPage /></ProtectedRoute>} />

                  {/* --- Rota Protegida para Funcionários --- */}
                  <Route path="/funcionario/dashboard" element={<ProtectedRoute role="funcionario"><FuncionarioDashboard /></ProtectedRoute>} />

                  {/* --- Rota Exclusiva para Dev --- */}
                  <Route path="/dev/dashboard" element={<ProtectedRoute role="dev"><DevDashboardPage /></ProtectedRoute>} />
                  
                  {/* --- Rotas Protegidas para Admin (e Funcionários com permissão) --- */}
                  
                  {/* ✅ CORREÇÃO: Adicionamos a 'prop' permission a todas as rotas relevantes */}
                  <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                  
                  <Route path="/admin/pedidos" element={
                    <ProtectedRoute role="admin" permission="admin_gerenciar_pedidos">
                      <AdminOrdersPage />
                    </ProtectedRoute>
                  }/>
                  
                  <Route path="/admin/venda-fisica" element={
                    <ProtectedRoute role="admin" permission="admin_registrar_venda_fisica">
                      <PhysicalSalePage />
                    </ProtectedRoute>
                  }/>

                  <Route path="/admin/financeiro" element={
                    <ProtectedRoute role="admin" permission="admin_painel_financeiro">
                      <FinancialDashboardPage />
                    </ProtectedRoute>
                  }/>
                  
                  <Route path="/admin/clientes" element={
                    <ProtectedRoute role="admin" permission="admin_info_clientes">
                      <AdminCustomerInfoPage />
                    </ProtectedRoute>
                  }/>

                  <Route path="/admin/boletos" element={
                    <ProtectedRoute role="admin" permission="sistema_boleto">
                      <AdminBoletosPage />
                    </ProtectedRoute>
                  }/>

                  <Route path="/admin/comandas" element={
                    <ProtectedRoute role="admin" permission="admin_gerenciar_comandas">
                      <AdminComandaPage />
                    </ProtectedRoute>
                  }/>

                  <Route path="/admin/funcionarios" element={
                    <ProtectedRoute role="admin" permission="admin_gerenciar_funcionarios">
                      <AdminFuncionariosPage />
                    </ProtectedRoute>
                  }/>

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