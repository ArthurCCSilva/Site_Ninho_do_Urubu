// src/components/Navbar.jsx
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 1. Importe o useAuth

function AppNavbar() {
  // 2. Pegue o usuário e a função logout do nosso contexto
  const { user, logout } = useAuth();
  // ADICIONE ESTA LINHA
  //console.log('[Navbar] Usuário recebido do contexto:', user);
  
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
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              {/* Usamos NavLink para que o link "ativo" ganhe um estilo especial */}
              <NavLink className="nav-link" to="/">Home</NavLink>
            </li>

            {/* --- LÓGICA DE EXIBIÇÃO CONDICIONAL --- */}
            {user ? (
              // 3. SE o usuário existir (estiver logado)...
              <>
                {user.role === 'admin' && (
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/admin/dashboard">Dashboard</NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink className="nav-link" to="/carrinho">Carrinho</NavLink>
                </li>
                
                {/* --- ALTERAÇÃO AQUI: De Dropdown para Botão de Sair direto --- */}
                <li className="nav-item">
                  <span className="nav-link text-light" style={{ cursor: 'default' }}>
                    {/* O '?.' antes de .nome verifica se 'user' existe antes de tentar acessá-lo.
                        O '?.' antes de .split verifica se 'user.nome' existe antes de tentar dividi-lo.
                        O '||' fornece um valor padrão caso tudo antes dele falhe. */}
                    Olá, {user?.nome?.split(' ')[0] || 'Usuário'}
                  </span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-link nav-link" onClick={logout} style={{ textDecoration: 'none' }}>
                    Sair
                  </button>
                </li>
                {/* --- FIM DA ALTERAÇÃO --- */}
              </>
            ) : (
              // 4. SE o usuário NÃO existir (não estiver logado)...
              <li className="nav-item">
                <NavLink className="nav-link" to="/login">Login</NavLink>
              </li>
            )}

          </ul>
        </div>
      </div>
    </nav>
  );
}

export default AppNavbar;