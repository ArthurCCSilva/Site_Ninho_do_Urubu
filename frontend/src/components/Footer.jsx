// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer mt-auto py-3 bg-light">
      <div className="container text-center">
        <span className="text-muted">© 2025 Ninho do Urubu Store. Todos os direitos reservados.</span>
        <Link to="/login-funcionario" className="ms-3 text-muted">Login de Funcionário</Link>
      </div>
    </footer>
  );
}

export default Footer;