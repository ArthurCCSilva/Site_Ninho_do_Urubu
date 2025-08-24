// src/pages/AdminOrdersPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import OrderDetailsModal from '../components/OrderDetailsModal';
import AdminCancelOrderModal from '../components/AdminCancelOrderModal';
import Pagination from '../components/Pagination';
import AdminActionModal from '../components/AdminActionModal';

function AdminOrdersPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchPedidos = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit });
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      const response = await api.get(`/api/pedidos/admin/todos?${params.toString()}`);
      setPedidos(response.data.pedidos);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (err) {
      setError('Não foi possível carregar os pedidos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceFetch = setTimeout(() => { fetchPedidos(1); }, 500);
    return () => clearTimeout(debounceFetch);
  }, [limit, searchTerm, filterStatus]);
  
  useEffect(() => {
    fetchPedidos(currentPage);
  }, [currentPage]);

  const handleShowDetails = (pedidoId) => { setSelectedPedidoId(pedidoId); setShowDetailsModal(true); };
  
  const handleUpdateStatus = async (pedidoId, novoStatus) => {
    try {
      await api.patch(`/api/pedidos/${pedidoId}/status`, { status: novoStatus });
      alert('Status do pedido atualizado com sucesso!');
      fetchPedidos(currentPage);
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
      fetchPedidos(currentPage);
    } catch (err) {
      alert('Falha ao cancelar o pedido.');
    }
  };

  const handleShowActionModal = (pedido) => {
    setSelectedPedido(pedido);
    setShowActionModal(true);
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
      
      <div className="card card-body mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Pesquisar por nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Todos os Status</option>
              <option value="Processando">Processando</option>
              <option value="Enviado">Enviado</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>
      
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
                  <th className="text-end">Ações</th>
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
                    <td className="text-end">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleShowActionModal(pedido)}>
                        Ações
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-footer d-flex justify-content-between align-items-center">
          <div className="col-auto">
            <label htmlFor="limit-select" className="col-form-label me-2">Itens por página:</label>
            <select 
              id="limit-select"
              className="form-select form-select-sm d-inline-block" 
              style={{ width: 'auto' }}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
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
      <AdminActionModal 
        show={showActionModal}
        onHide={() => setShowActionModal(false)}
        pedido={selectedPedido}
        onUpdateStatus={handleUpdateStatus}
        onShowCancelModal={handleShowCancelModal}
        onShowDetails={handleShowDetails} // ✅ ADICIONA A PROP FALTANTE
      />
    </div>
  );
}

export default AdminOrdersPage;