//index.js
require('dotenv').config(); //Para gerenciar variáveis de ambiente (como senhas do banco).
const express = require('express');//Nosso framework para criar o servidor.
const cors = require('cors')//Para permitir que o frontend se comunique com o backend.

const app = express();//- Cria uma instância do servidor Express.
app.use(cors());// Habilita o CORS
app.use(express.json());//// Permite que o servidor entenda JSON

// --- ROTAS ---
app.use('/api/produtos', require('./routes/produtos'));
//app.use('/api/auth', require('./routes/auth'));// futuro

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});