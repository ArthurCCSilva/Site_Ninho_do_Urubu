// src/context/CartContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const { token, isLoading: isAuthLoading } = useAuth();

  const fetchCartItems = async () => {
    if (!token) return;
    try {
      const response = await api.get('/api/carrinho'); // Header já é adicionado globalmente
      setCartItems(response.data);
    } catch (error) {
      console.error("Falha ao buscar itens do carrinho", error);
      setCartItems([]);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && token) {
      fetchCartItems();
    } else if (!isAuthLoading && !token) {
      setCartItems([]);
    }
  }, [token, isAuthLoading]);

  const addToCart = async (produto_id, quantidade = 1) => {
    if (!token) {
      alert('Você precisa estar logado para adicionar itens ao carrinho.');
      return;
    }
    try {
      await api.post('/api/carrinho', { produto_id, quantidade });
      fetchCartItems();
    } catch (error) {
      console.error("Falha ao adicionar ao carrinho", error);
      alert(error.response?.data?.message || 'Erro ao adicionar item.');
    }
  };

  const removeFromCart = async (produto_id) => {
    if (!token) return;
    try {
      await api.delete(`/api/carrinho/${produto_id}`);
      fetchCartItems();
    } catch (error) {
      console.error("Falha ao remover do carrinho", error);
    }
  };
  
  // ✅ FUNÇÃO CHECKOUT ATUALIZADA
  const checkout = async (formaPagamento, localEntrega, valorPago, infoBoleto) => {
    if (!token) throw new Error("Usuário não autenticado.");
    try {
      const payload = { 
        forma_pagamento: formaPagamento,
        local_entrega: localEntrega,
        valor_pago_cliente: valorPago,
        info_boleto: infoBoleto // Envia as informações do plano de boleto
      };
      const response = await api.post('/api/pedidos', payload);
      setCartItems([]);
      return response.data; 
    } catch (error) {
      console.error("Falha ao finalizar a compra", error);
      throw error; 
    }
  };

  const updateQuantity = async (produto_id, quantidade) => {
    if (quantidade <= 0) {
      removeFromCart(produto_id);
      return;
    }
    try {
      await api.put('/api/carrinho', { produto_id, quantidade });
      fetchCartItems();
    } catch (error) {
      console.error("Falha ao atualizar a quantidade", error);
      alert(error.response?.data?.message || 'Não foi possível atualizar a quantidade.');
      fetchCartItems();
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, checkout, updateQuantity, fetchCartItems }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  return useContext(CartContext);
};