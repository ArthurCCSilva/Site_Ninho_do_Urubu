// src/context/CartContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const { token, isLoading: isAuthLoading } = useAuth();

  // Função para buscar os itens do carrinho
  const fetchCartItems = async () => {
    if (!token) return; // Se não houver token, não faz nada
    try {
      // ✅ Passa o token diretamente na configuração da chamada
      const response = await api.get('/api/carrinho', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCartItems(response.data);
    } catch (error) {
      console.error("Falha ao buscar itens do carrinho", error);
      setCartItems([]);
    }
  };

  // useEffect para buscar os itens de forma segura
  useEffect(() => {
    // Só tenta buscar os itens se a autenticação já terminou E se o usuário está logado
    if (!isAuthLoading && token) {
      fetchCartItems();
    } else if (!isAuthLoading && !token) {
      // Garante que o carrinho esteja vazio para visitantes ou após o logout
      setCartItems([]);
    }
  }, [token, isAuthLoading]);

  // Função para adicionar itens (também envia o token diretamente)
  const addToCart = async (produto_id, quantidade = 1) => {
    if (!token) {
      alert('Você precisa estar logado para adicionar itens ao carrinho.');
      return;
    }
    try {
      await api.post('/api/carrinho', { produto_id, quantidade }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCartItems(); // Re-busca os itens para atualizar o estado
    } catch (error) {
      console.error("Falha ao adicionar ao carrinho", error);
      alert('Erro ao adicionar item. Por favor, tente fazer o login novamente.');
    }
  };

  // Função para remover itens (também envia o token diretamente)
  const removeFromCart = async (produto_id) => {
    if (!token) return;
    try {
      await api.delete(`/api/carrinho/${produto_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCartItems(); // Re-busca os itens para atualizar o estado
    } catch (error) {
      console.error("Falha ao remover do carrinho", error);
    }
  };
  
  // Função de checkout (também envia o token diretamente)
  const checkout = async (formaPagamento, localEntrega) => {
    if (!token) throw new Error("Usuário não autenticado.");
    try {
      // Envia os novos dados no corpo da requisição
      const response = await api.post('/api/pedidos', 
        { 
          forma_pagamento: formaPagamento,
          local_entrega: localEntrega
        }, 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setCartItems([]);
      return response.data; 
    } catch (error) {
      console.error("Falha ao finalizar a compra", error);
      throw error; 
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, checkout }}>
      {children}
    </CartContext.Provider>
  );
}

// O hook de exportação se chama 'useCart'
export const useCart = () => {
  return useContext(CartContext);
};