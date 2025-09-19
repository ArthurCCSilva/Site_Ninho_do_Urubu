// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  // A baseURL deve ser vazia ou '/'. O importante é que as chamadas
  // nas páginas usem o caminho completo, ex: api.get('/api/produtos')
  baseURL: '/', 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;