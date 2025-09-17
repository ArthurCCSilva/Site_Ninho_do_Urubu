// frontend/src/pages/TermosDeUsoPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function TermosDeUsoPage() {
  return (
    <div className="container my-5">
      <h1 className="mb-4">Termos e Condições de Uso</h1>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">1. Aceitação dos Termos</h5>
          <p className="card-text">
            Ao acessar e usar os serviços da Ninho do Urubu Store, você concorda em cumprir e estar vinculado a estes termos e condições.
          </p>

          <h5 className="card-title mt-4">2. Cadastro e Conta</h5>
          <p className="card-text">
            Você declara ser maior de 18 anos e fornecer informações verdadeiras, precisas e completas durante o processo de cadastro. A segurança da sua senha é de sua responsabilidade.
          </p>

          <h5 className="card-title mt-4">3. Privacidade</h5>
          <p className="card-text">
            Nossa política de privacidade, que descreve como coletamos e usamos suas informações, faz parte destes termos.
          </p>
        </div>
      </div>
      
      <div className="text-center mt-4">
        {/* ✅ CORREÇÃO: O link agora aponta para a página de login (onde está o cadastro)
            e o texto foi atualizado para "Voltar para o Cadastro". */}
        <Link to="/login" className="btn btn-primary">
          Voltar para o Login
        </Link>
      </div>
    </div>
  );
}

export default TermosDeUsoPage;