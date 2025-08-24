// src/pages/AdminOrdersPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import OrderDetailsModal from '../components/OrderDetailsModal';
import AdminCancelOrderModal from '../components/AdminCancelOrderModal'; // 1. Importa o novo modal

function AdminOrdersPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para o modal de detalhes
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);

  // ✅ 2. ADICIONA estados para o modal de cancelamento
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Função para buscar todos os pedidos
  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/pedidos/admin/todos');
      setPedidos(response.data);
    } catch (err) {
      setError('Não foi possível carregar os pedidos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Busca os pedidos quando a página carrega
  useEffect(() => {
    fetchPedidos();
  }, []);

  // Função para abrir o modal de detalhes
  const handleShowDetails = (pedidoId) => {
    setSelectedPedidoId(pedidoId);
    setShowDetailsModal(true);
  };

  // Função para o admin atualizar o status de um pedido
  const handleUpdateStatus = async (pedidoId, novoStatus) => {
    try {
      await api.patch(`/api/pedidos/${pedidoId}/status`, { status: novoStatus });
      alert('Status do pedido atualizado com sucesso!');
      fetchPedidos(); // Re-busca os pedidos para mostrar a atualização
    } catch (err) {
      alert('Falha ao atualizar o status do pedido.');
    }
  };

  // ✅ 3. ATUALIZA as funções para controlar o modal de cancelamento
  // Abre o modal de cancelamento e guarda o ID do pedido selecionado
  const handleShowCancelModal = (pedidoId) => {
    setSelectedPedidoId(pedidoId);
    setShowCancelModal(true);
  };
  
  // É chamada pelo modal ao confirmar. Envia o motivo para a API.
  const handleConfirmCancel = async (motivo) => {
    try {
      await api.patch(`/api/pedidos/${selectedPedidoId}/cancelar-admin`, { motivo });
      alert('Pedido cancelado com sucesso!');
      setShowCancelModal(false); // Fecha o modal
      fetchPedidos(); // Atualiza a lista
    } catch (err) {
      alert('Falha ao cancelar o pedido.');
    }
  };

  // Função para dar a cor correta ao status do pedido
  const getStatusClass = (status) => {
    switch (status) {
      case 'Entregue': return 'success';
      case 'Cancelado': return 'danger';
      case 'Enviado': return 'info';
      default: return 'warning'; // Processando
    }
  };

  if (loading) return <div className="text-center my-5"><div className="spinner-border" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <h1 className="mb-4">Gerenciamento de Pedidos</h1>
      
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th># Pedido</th>
                  <th>Data</th>
                  <th>Valor Total</th>
                  <th>Status Atual</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(pedido => (
                  <tr key={pedido.id}>
                    <td>
                      <img 
                        src={pedido.cliente_imagem_url ? `http://localhost:3001/uploads/${pedido.cliente_imagem_url}` : 'https://placehold.co/40'} 
                        alt={pedido.cliente_nome}
                        className="rounded-circle me-2"
                        width="40"
                        height="40"
                        style={{ objectFit: 'cover' }}
                      />
                      {pedido.cliente_nome}
                    </td>
                    <td>{pedido.id}</td>
                    <td>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</td>
                    <td>R$ {parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')}</td>
                    <td>
                      <span className={`badge bg-${getStatusClass(pedido.status)}`}>{pedido.status}</span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-primary btn-sm" onClick={() => handleShowDetails(pedido.id)}>
                          Detalhes
                        </button>
                        <button type="button" className="btn btn-primary btn-sm dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                          <span className="visually-hidden">Toggle Dropdown</span>
                        </button>
                        <ul className="dropdown-menu">
                          <li><button className="dropdown-item" onClick={() => handleUpdateStatus(pedido.id, 'Enviado')}>Marcar como "Enviado"</button></li>
                          <li><button className="dropdown-item" onClick={() => handleUpdateStatus(pedido.id, 'Entregue')}>Marcar como "Entregue"</button></li>
                          <li><hr className="dropdown-divider" /></li>
                          {/* ✅ 4. BOTÃO de cancelar agora chama a função que abre o modal */}
                          <li><button className="dropdown-item text-danger" onClick={() => handleShowCancelModal(pedido.id)}>Cancelar Pedido</button></li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Os dois modais são renderizados aqui, mas ficam invisíveis até serem chamados */}
      <OrderDetailsModal 
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        pedidoId={selectedPedidoId}
      />
      <AdminCancelOrderModal 
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}

export default AdminOrdersPage;