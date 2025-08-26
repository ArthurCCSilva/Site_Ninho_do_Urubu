// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// 1. CSS do Bootstrap vem PRIMEIRO
import 'bootstrap/dist/css/bootstrap.min.css';

// 2. CSS de bibliotecas vêm DEPOIS
import 'react-phone-number-input/style.css'; 

// 3. NOSSOS CSS customizados vêm por ÚLTIMO
import './index.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  // Vamos voltar a usar o StrictMode. A lógica da nossa Navbar
  // já foi robusta o suficiente para não precisar removê-lo.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);