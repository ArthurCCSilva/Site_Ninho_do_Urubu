//index.js
require('dotenv').config(); //Para gerenciar variáveis de ambiente (como senhas do banco).
const express = require('express');//Nosso framework para criar o servidor.
const cors = require('cors')//Para permitir que o frontend se comunique com o backend.

// Importa as rotas
const authRoutes = require('./routes/authRoutes');
const produtosRoutes = require('./routes/produtosRoutes');
// ✅ 1. IMPORTE A NOVA ROTA DE CATEGORIAS
const categoriasRoutes = require('./routes/categoriasRoutes');


const app = express();//- Cria uma instância do servidor Express.
app.use(cors());// Habilita o CORS
app.use(express.json());//// Permite que o servidor entenda JSON

// --- ROTAS ---
// ✅ 2. USE AS VARIÁVEIS QUE VOCÊ JÁ IMPORTOU (CÓDIGO MAIS LIMPO)
app.use('/api/produtos', produtosRoutes);
app.use('/api/auth', authRoutes);
// ✅ 3. ADICIONE A NOVA ROTA DE CATEGORIAS AQUI
app.use('/api/categorias', categoriasRoutes);

app.use('/api/carrinho', require('./routes/carrinhoRoutes'));//carrinho rota
app.use('/api/pedidos', require('./routes/pedidosRoutes'));
app.use('/api/usuarios', require('./routes/usuariosRoutes'));
app.use('/api/despesas', require('./routes/despesasRoutes'));
app.use('/api/financials', require('./routes/financialsRoutes'));
app.use('/api/despesa-categorias', require('./routes/despesaCategoriasRoutes'));
app.use('/api/rendas-extras', require('./routes/rendasExtrasRoutes'));
app.use('/api/boleto-planos', require('./routes/boletoPlanosRoutes'));
app.use('/uploads', express.static('uploads'));//adicionado depois para as imagens

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});