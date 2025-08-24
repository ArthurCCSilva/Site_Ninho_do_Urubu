// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// 1. Importa o arquivo CSS do Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
// 2. Importa o arquivo JavaScript do Bootstrap
import 'react-phone-number-input/style.css'; // <--Criar um campo de telefone internacional do zero é muito complexo

import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  
    <App />
  ,
)