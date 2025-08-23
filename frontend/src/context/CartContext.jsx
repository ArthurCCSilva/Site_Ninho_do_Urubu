// src/context/CartContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  // ✅ 1. PEGUE O 'token' E TAMBÉM O 'isLoading' DO AuthContext
  const { token, isLoading } = useAuth();

  const fetchCartItems = async () => {
    // A condição 'if (!token)' já existe, mas a lógica no useEffect será mais segura
    try {
      const response = await api.get('/api/carrinho');
      setCartItems(response.data);
    } catch (error) {
      console.error("Falha ao buscar itens do carrinho", error);
      // Limpa o carrinho em caso de erro (ex: token expirado)
      setCartItems([]);
    }
  };

  // ✅ 2. ATUALIZE O useEffect PARA ESPERAR O FIM DO CARREGAMENTO DA AUTENTICAÇÃO
  useEffect(() => {
    // Só tenta buscar os itens se:
    // a) A verificação de autenticação já terminou (isLoading é false)
    // b) O usuário está de fato logado (token existe)
    if (!isLoading && token) {
      fetchCartItems();
    } else if (!isLoading && !token) {
      // Se a verificação terminou e não há token (logout), limpa o carrinho
      setCartItems([]);
    }
  }, [token, isLoading]); // O gatilho agora é o token OU o estado de carregamento

  const addToCart = async (produto_id, quantidade = 1) => {
    try {
      await api.post('/api/carrinho', { produto_id, quantidade });
      fetchCartItems(); // Atualiza o carrinho
    } catch (error) {
      console.error("Falha ao adicionar ao carrinho", error);
      alert('Erro ao adicionar item. Tente fazer o login novamente.');
    }
  };

  const removeFromCart = async (produto_id) => {
    try {
      await api.delete(`/api/carrinho/${produto_id}`);
      fetchCartItems(); // Atualiza o carrinho
    } catch (error) {
      console.error("Falha ao remover do carrinho", error);
    }
  };

  const checkout = async () => {
    try {
      // Chama a API para criar o pedido a partir do carrinho
      const response = await api.post('/api/pedidos');
      // Após o sucesso, limpa os itens do carrinho no frontend
      setCartItems([]);
      // Retorna os dados do novo pedido, como o ID
      return response.data; 
    } catch (error) {
      console.error("Falha ao finalizar a compra", error);
      // Lança o erro para que a página do carrinho possa mostrar uma mensagem
      throw error; 
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, checkout }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  return useContext(CartContext);
};