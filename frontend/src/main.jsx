// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// 1. Importa o arquivo CSS do Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
// 2. Importa o arquivo JavaScript do Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)