// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function AppNavbar() {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navRef, togglerRef]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Ninho do Urubu Store</Link>
        <button ref={togglerRef} className="navbar-toggler" type="button" aria-expanded={isNavExpanded} aria-label="Toggle navigation" onClick={() => setIsNavExpanded(!isNavExpanded)}>
          <span className={`toggler-icon ${isNavExpanded ? 'close-icon' : 'hamburger-icon'}`}></span>
        </button>
        <div ref={navRef} className={`collapse navbar-collapse ${isNavExpanded ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" onClick={() => setIsNavExpanded(false)}>Home</NavLink>
            </li>
            
            {user ? (
              // SE o usuário estiver logado...
              <>
                <li className="nav-item">
                  <NavLink className="nav-link position-relative" to="/carrinho" onClick={() => setIsNavExpanded(false)}>
                    Carrinho
                    {cartItems.length > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {cartItems.length}
                      </span>
                    )}
                  </NavLink>
                </li>

                {/* --- ✅ ATUALIZAÇÃO PARA O MENU DROPDOWN UNIFICADO --- */}
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Olá, {user?.nome?.split(' ')[0] || 'Usuário'}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end">
                    
                    {/* Link de Dashboard só aparece se for admin */}
                    {user.role === 'admin' && (
                      <li>
                        <Link className="dropdown-item" to="/admin/dashboard" onClick={() => setIsNavExpanded(false)}>
                          Dashboard
                        </Link>
                      </li>
                    )}

                    {/* Link do Painel do Cliente aparece para todos os usuários logados */}
                    <li>
                      <Link className="dropdown-item" to="/meus-pedidos" onClick={() => setIsNavExpanded(false)}>
                        Painel do Cliente
                      </Link>
                    </li>
                    
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={() => { logout(); setIsNavExpanded(false); }}>
                        Sair
                      </button>
                    </li>
                  </ul>
                </li>
                {/* --- FIM DA ATUALIZAÇÃO --- */}
              </>
            ) : (
              // SE o usuário NÃO estiver logado...
              <li className="nav-item">
                <NavLink className="nav-link" to="/login" onClick={() => setIsNavExpanded(false)}>Login</NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default AppNavbar;