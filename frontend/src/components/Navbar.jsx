// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // ✅ 1. IMPORTE o useCart

function AppNavbar() {
  const { user, logout } = useAuth();
  const { cartItems } = useCart(); // ✅ 2. PEGUE os itens do carrinho do contexto

  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const navRef = useRef(null);
  const togglerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setIsNavExpanded(false);
  }, [location]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        navRef.current && !navRef.current.contains(event.target) &&
        togglerRef.current && !togglerRef.current.contains(event.target)
      ) {
        setIsNavExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navRef, togglerRef]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Ninho do Urubu Store</Link>

        <button
          ref={togglerRef}
          className="navbar-toggler"
          type="button"
          aria-expanded={isNavExpanded}
          aria-label="Toggle navigation"
          onClick={() => setIsNavExpanded(!isNavExpanded)}
        >
          <span className={`toggler-icon ${isNavExpanded ? 'close-icon' : 'hamburger-icon'}`}></span>
        </button>

        <div ref={navRef} className={`collapse navbar-collapse ${isNavExpanded ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item"><NavLink className="nav-link" to="/" onClick={() => setIsNavExpanded(false)}>Home</NavLink></li>

            {user ? (
              <>
                {user.role === 'admin' && (<li className="nav-item"><NavLink className="nav-link" to="/admin/dashboard" onClick={() => setIsNavExpanded(false)}>Dashboard</NavLink></li>)}

                <li className="nav-item">
                  {/* ✅ 3. ADICIONE o contador (badge) ao lado do link 'Carrinho' */}
                  <NavLink className="nav-link" to="/carrinho" onClick={() => setIsNavExpanded(false)}>
                    Carrinho <span className="badge bg-light text-dark ms-1">{cartItems.length}</span>
                  </NavLink>
                </li>

                {/* Mostra o link para o painel do cliente se ele não for admin */}
                {user.role === 'cliente' && (
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/meus-pedidos">Meus Pedidos</NavLink>
                  </li>
                )}

                <li className="nav-item"><span className="nav-link text-light" style={{ cursor: 'default' }}>Olá, {user?.nome?.split(' ')[0] || 'Usuário'}</span></li>
                <li className="nav-item"><button className="btn btn-link nav-link" onClick={() => { logout(); setIsNavExpanded(false); }} style={{ textDecoration: 'none' }}>Sair</button></li>
              </>
            ) : (
              <li className="nav-item"><NavLink className="nav-link" to="/login" onClick={() => setIsNavExpanded(false)}>Login</NavLink></li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default AppNavbar;