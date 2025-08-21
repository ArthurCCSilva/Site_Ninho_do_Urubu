// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importando nossos componentes e páginas
import AppNavbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrdersPage from './pages/AdminOrdersPage';
import CustomerCartPage from './pages/CustomerCartPage';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppNavbar />
        <main className="container mt-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* ROTA PROTEGIDA */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* ... outras rotas ... */}
          </Routes>
        </main>
      </AuthProvider>  
    </Router>
  );
}

export default App;