// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AppNavbar() {
  const { user, logout } = useAuth();
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const navRef = useRef(null); // Referência para o menu
  const togglerRef = useRef(null); // ✅ NOVA REFERÊNCIA para o botão
  const location = useLocation();

  useEffect(() => {
    setIsNavExpanded(false);
  }, [location]);

  // ✅ LÓGICA DE CLIQUE FORA ATUALIZADA
  useEffect(() => {
    function handleClickOutside(event) {
      // Fecha o menu se o clique for fora do menu E fora do botão
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
  }, [navRef, togglerRef]); // Adiciona a nova referência à lista de dependências

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Ninho do Urubu Store</Link>
        
        <button
          ref={togglerRef} // ✅ Adiciona a referência ao botão
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
            {/* O conteúdo do <ul> continua o mesmo */}
            <li className="nav-item"><NavLink className="nav-link" to="/" onClick={() => setIsNavExpanded(false)}>Home</NavLink></li>
            {user ? (
              <>
                {user.role === 'admin' && (<li className="nav-item"><NavLink className="nav-link" to="/admin/dashboard" onClick={() => setIsNavExpanded(false)}>Dashboard</NavLink></li>)}
                <li className="nav-item"><NavLink className="nav-link" to="/carrinho" onClick={() => setIsNavExpanded(false)}>Carrinho</NavLink></li>
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