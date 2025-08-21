// src/components/Navbar.jsx
import { Link } from 'react-router-dom';

function AppNavbar() {
  // O 'Link' do react-router-dom é usado no lugar da tag <a>
  // para uma navegação mais rápida, sem recarregar a página.
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Ninho do Urubu Store</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/login">Login</Link>
            </li>
            {/* Futuramente, podemos adicionar links que só aparecem se o usuário for admin */}
            <li className="nav-item">
              <Link className="nav-link" to="/admin/dashboard">Dashboard (Admin)</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/carrinho">Carrinho</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default AppNavbar;