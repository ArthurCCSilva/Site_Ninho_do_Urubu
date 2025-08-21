// src/pages/LoginPage.jsx
import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

function LoginPage() {
  // Este estado controla qual formulário é exibido: o de login ou o de cadastro.
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    // O <Container> do react-bootstrap vira uma <div className="container">
    <div className="container">
      {/* O <Row> vira uma <div className="row"> */}
      <div className="row justify-content-md-center">
        {/* O <Col> vira uma <div className="col-..."> */}
        <div className="col-md-6">
          
          {/* O <Card> do react-bootstrap vira uma <div className="card"> */}
          <div className="card">
            
            {/* O <Card.Header> e o <Nav> viram uma estrutura de <ul> com classes */}
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  {/* O <Nav.Link> vira um <button> para controlarmos o clique */}
                  {/* A classe 'active' é aplicada condicionalmente */}
                  <button 
                    className={`nav-link ${isLoginView ? 'active' : ''}`}
                    onClick={() => setIsLoginView(true)}
                  >
                    Login
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${!isLoginView ? 'active' : ''}`}
                    onClick={() => setIsLoginView(false)}
                  >
                    Cadastro
                  </button>
                </li>
              </ul>
            </div>
            
            {/* O <Card.Body> vira uma <div className="card-body"> */}
            <div className="card-body">
              {/* A lógica para mostrar o formulário correto continua a mesma */}
              {isLoginView ? <LoginForm /> : <RegisterForm />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;