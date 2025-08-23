// src/pages/CustomerDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OrderList from '../components/OrderList'; // ✅ 1. IMPORTE o novo componente

function CustomerDashboard() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ 2. ADICIONE o estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState('andamento');

  useEffect(() => {
    const fetchPedidos = async () => {
      if (!user) return; // Garante que o usuário existe antes de buscar
      try {
        setLoading(true);
        const response = await api.get('/api/pedidos/meus-pedidos');
        setPedidos(response.data);
      } catch (err) {
        setError('Não foi possível carregar seus pedidos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPedidos();
  }, [user]); // Roda a busca quando a informação do usuário estiver disponível

  // ✅ 3. FILTRE os pedidos em duas listas separadas
  const pedidosEmAndamento = pedidos.filter(p => p.status === 'Processando' || p.status === 'Enviado');
  const pedidosConcluidos = pedidos.filter(p => p.status === 'Entregue' || p.status === 'Cancelado');

  if (loading) return <div className="text-center my-5"><div className="spinner-border" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <h1 className="mb-4">Painel do Cliente</h1>
      <p>Olá, <strong>{user?.nome}</strong>. Aqui você pode acompanhar suas compras.</p>
      
      {/* ✅ 4. ESTRUTURA DE ABAS (TABS) DO BOOTSTRAP */}
      <div className="card mt-4">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'andamento' ? 'active' : ''}`}
                onClick={() => setActiveTab('andamento')}
              >
                Pedidos em Andamento ({pedidosEmAndamento.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'concluidos' ? 'active' : ''}`}
                onClick={() => setActiveTab('concluidos')}
              >
                Histórico de Compras ({pedidosConcluidos.length})
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {/* Renderização condicional: mostra uma lista ou outra dependendo da aba ativa */}
          {activeTab === 'andamento' && (
            <div>
              <h4 className="card-title">Seus Pedidos Atuais</h4>
              <p className="card-subtitle mb-3 text-muted">Acompanhe os pedidos que ainda não foram entregues.</p>
              <OrderList pedidos={pedidosEmAndamento} />
            </div>
          )}
          {activeTab === 'concluidos' && (
            <div>
              <h4 className="card-title">Seu Histórico</h4>
              <p className="card-subtitle mb-3 text-muted">Veja todas as suas compras já finalizadas ou canceladas.</p>
              <OrderList pedidos={pedidosConcluidos} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;