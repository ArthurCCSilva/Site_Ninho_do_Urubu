// src/pages/AdminOrdersPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import OrderDetailsModal from '../components/OrderDetailsModal';
import AdminCancelOrderModal from '../components/AdminCancelOrderModal';

function AdminOrdersPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

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

  useEffect(() => {
    fetchPedidos();
  }, []);

  const handleShowDetails = (pedidoId) => { setSelectedPedidoId(pedidoId); setShowDetailsModal(true); };
  
  const handleUpdateStatus = async (pedidoId, novoStatus) => {
    try {
      await api.patch(`/api/pedidos/${pedidoId}/status`, { status: novoStatus });
      alert('Status do pedido atualizado com sucesso!');
      fetchPedidos();
    } catch (err) {
      alert('Falha ao atualizar o status do pedido.');
    }
  };

  const handleShowCancelModal = (pedidoId) => {
    setSelectedPedidoId(pedidoId);
    setShowCancelModal(true);
  };
  
  const handleConfirmCancel = async (motivo) => {
    try {
      await api.patch(`/api/pedidos/${selectedPedidoId}/cancelar-admin`, { motivo });
      alert('Pedido cancelado com sucesso!');
      setShowCancelModal(false);
      fetchPedidos();
    } catch (err) {
      alert('Falha ao cancelar o pedido.');
    }
  };

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
                  <th>Datas</th>
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
                    <td>
                      <small className="d-block">Pedido: {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</small>
                      {pedido.data_entrega && (
                        <small className="d-block text-success">
                          Entregue: {new Date(pedido.data_entrega).toLocaleDateString('pt-BR')}
                        </small>
                      )}
                    </td>
                    <td>R$ {parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')}</td>
                    <td>
                      <span className={`badge bg-${getStatusClass(pedido.status)}`}>{pedido.status}</span>
                    </td>
                    <td>
                      {pedido.status === 'Cancelado' ? (
                        <span className="text-muted fst-italic">Cancelado</span>
                      ) : (
                        <div className="btn-group">
                          <button className="btn btn-secondary btn-sm" onClick={() => handleShowDetails(pedido.id)}>
                            Detalhes
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                            <span className="visually-hidden">Toggle Dropdown</span>
                          </button>
                          <ul className="dropdown-menu">
                            {/* ✅ NOVA OPÇÃO "PROCESSANDO" ADICIONADA */}
                            <li><button className="dropdown-item" onClick={() => handleUpdateStatus(pedido.id, 'Processando')}>Marcar como "Processando"</button></li>
                            <li><button className="dropdown-item" onClick={() => handleUpdateStatus(pedido.id, 'Enviado')}>Marcar como "Enviado"</button></li>
                            <li><button className="dropdown-item" onClick={() => handleUpdateStatus(pedido.id, 'Entregue')}>Marcar como "Entregue"</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item text-danger" onClick={() => handleShowCancelModal(pedido.id)}>Cancelar Pedido (Admin)</button></li>
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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