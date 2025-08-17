//db.js
const mysql = require('mysql2');//conectar seu código Node.js ao MySQL.
require('dontev').config(); //- Isso carrega as variáveis do arquivo .env para o process.env.


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,//espera por uma conexão livre se todas estiverem ocupadas.
    connectionLimit: 10,
    queueLimit:0
});

// Usamos a versão com 'promise' para poder usar async/await
module.exports = pool.promise();