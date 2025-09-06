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

  // Função para buscar os pedidos com base em todos os filtros e paginação
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
      setError(null); // Limpa erros antigos em caso de sucesso
    } catch (err) { // ✅ Garante que a variável de erro é 'err'
      setError('Não foi possível carregar os pedidos.');
      console.error("Erro em fetchPedidos:", err); // ✅ Usa a variável correta 'err'
    } finally {
      setLoading(false);
    }
  };

  // useEffect para buscar os dados quando um filtro é alterado
  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchPedidos(1);
      }
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [limit, searchTerm, filterStatus]);
  
  // useEffect para buscar os dados quando a página atual muda
  useEffect(() => {
    fetchPedidos(currentPage);
  }, [currentPage]);

  const handleShowDetails = (pedidoId) => {
    setSelectedPedidoId(pedidoId);
    setShowDetailsModal(true);
  };
  
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
    // Usamos 'selectedPedido' que já tem todos os dados, incluindo o telefone
    if (!selectedPedido) return;

    try {
      // 1. Chama a API para cancelar o pedido no banco
      await api.patch(`/api/pedidos/admin/${selectedPedido.id}/cancelar`, { motivo });
      
      const telefoneCliente = selectedPedido.cliente_telefone;

      if (telefoneCliente) {
        // 2. Formata a mensagem para a URL
        const textoMensagem = `Olá, seu pedido #${selectedPedido.id} na Ninho do Urubu Store foi cancelado. Motivo: ${motivo}`;
        const mensagemFormatada = encodeURIComponent(textoMensagem);

        // 3. Cria o link do WhatsApp e abre em uma nova aba
        const whatsappUrl = `https://wa.me/${telefoneCliente}?text=${mensagemFormatada}`;
        window.open(whatsappUrl, '_blank');
      }

      alert('Pedido cancelado com sucesso!');
      setShowCancelModal(false);
      fetchPedidos(currentPage); // Atualiza a lista
    } catch (err) {
      alert('Falha ao cancelar o pedido.');
    }
  };

  const handleShowActionModal = (pedido) => {
    setSelectedPedido(pedido);
    setShowActionModal(true);
  };

  const handleBackToActions = () => {
    setShowDetailsModal(false);
    setShowActionModal(true);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Entregue': return 'success';
      case 'Cancelado': return 'danger';
      case 'Enviado': return 'info';
      default: return 'warning';
    }
  };

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
                        width="40" height="40"
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
                    <td><span className={`badge bg-${getStatusClass(pedido.status)}`}>{pedido.status}</span></td>
                    <td className="text-end">
                      {(pedido.status === 'Cancelado' && pedido.cancelado_por === 'cliente') ? (
                        <span className="text-muted fst-italic">Cancelado pelo Cliente</span>
                      ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleShowActionModal(pedido)}>
                          Ações
                        </button>
                      )}
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
              onChange={(e) => setLimit(Number(e.target.value))}
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
        onBack={handleBackToActions}
        onOrderUpdate={fetchPedidos}
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
        onShowDetails={handleShowDetails}
      />
    </div>
  );
}

export default AdminOrdersPage;