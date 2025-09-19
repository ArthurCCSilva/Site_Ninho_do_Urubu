// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(), 
    basicSsl() // Ativa o SSL
  ],
  server: {
    host: true, // Expõe o servidor na rede
    https: true, // Ativa o HTTPS
    proxy: {
      // Redireciona qualquer chamada '/api' para o seu backend
      '/api': {
        target: 'http://localhost:3001', // Endereço do seu backend
        changeOrigin: true,
      },
    },
  },
})