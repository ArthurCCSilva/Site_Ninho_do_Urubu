// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// O nome do componente deve ser consistente, vamos usar Navbar
function Navbar() {
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
  
  const handleNavLinkClick = () => {
    setIsNavExpanded(false);
  };

  useEffect(() => {
    if (isNavExpanded) {
      document.body.classList.add('nav-open');
    } else {
      document.body.classList.remove('nav-open');
    }
  }, [isNavExpanded]);

  // ✅ LÓGICA DE VERIFICAÇÃO DE ROLE CORRIGIDA
  // Usamos 'user.role', que agora é uma string simples ('admin', 'dev', etc.)
  const isAdmin = user?.role === 'admin';
  const isDev = user?.role === 'dev';
  const isFuncionario = user?.role === 'funcionario';
  const isClient = user && !isAdmin && !isDev && !isFuncionario;

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

        {isNavExpanded && <div className="nav-overlay" onClick={() => setIsNavExpanded(false)}></div>}

        <div 
          ref={navRef} 
          className={`collapse navbar-collapse ${isNavExpanded ? 'show nav-full-screen' : ''}`} 
          id="navbarNav"
        >
          <ul className="navbar-nav ms-auto align-items-center">
            {/* Links de Home e Carrinho não aparecem para Dev */}
            {!isDev && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/" onClick={handleNavLinkClick}>Home</NavLink>
                </li>
                {/* Carrinho só para clientes logados */}
                {isClient && (
                  <li className="nav-item">
                    <NavLink className="nav-link position-relative" to="/carrinho" onClick={handleNavLinkClick}>
                      Carrinho
                      {cartItems.length > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                          {cartItems.length}
                        </span>
                      )}
                    </NavLink>
                  </li>
                )}
              </>
            )}
            
            {user ? (
              // Se o usuário estiver logado...
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {/* ✅ CORREÇÃO DO NOME: Usamos 'nomeCompleto' */}
                  Olá, {user?.nomeCompleto?.split(' ')[0] || 'Usuário'}
                </a>
                <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end">
                  
                  {isDev && (
                    <li>
                      <Link className="dropdown-item" to="/dev/dashboard" onClick={handleNavLinkClick}>
                        Painel do Desenvolvedor
                      </Link>
                    </li>
                  )}

                  {isAdmin && (
                    <li>
                      <Link className="dropdown-item" to="/admin/dashboard" onClick={handleNavLinkClick}>
                        Dashboard Admin
                      </Link>
                    </li>
                  )}

                  {isFuncionario && (
                    <li>
                      <Link className="dropdown-item" to="/funcionario/dashboard" onClick={handleNavLinkClick}>
                        Painel do Funcionário
                      </Link>
                    </li>
                  )}
                  
                  {isClient && (
                    <li>
                      <Link className="dropdown-item" to="/meus-pedidos" onClick={handleNavLinkClick}>
                        Painel do Cliente
                      </Link>
                    </li>
                  )}
                  
                  <li><hr className="dropdown-divider" /></li>

                  <li>
                    <button className="dropdown-item" onClick={() => { logout(); handleNavLinkClick(); }}>
                      Sair
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              // Se não estiver logado...
              <li className="nav-item">
                <NavLink className="nav-link" to="/login" onClick={handleNavLinkClick}>Login</NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

// Lembre-se de exportar com o nome correto
export default Navbar;