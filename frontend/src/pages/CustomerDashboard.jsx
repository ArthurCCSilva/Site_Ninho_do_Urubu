// src/pages/CustomerDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OrderList from '../components/OrderList';
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';
import EditProfileModal from '../components/EditProfileModal';

function CustomerDashboard() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('andamento');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  useEffect(() => {
    const fetchPedidos = async () => {
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
    if (!isAuthLoading && user) {
      fetchPedidos();
    } else if (!isAuthLoading && !user) {
      setLoading(false);
      setPedidos([]);
    }
  }, [user, isAuthLoading]);

  const handleCancelarPedido = async (pedidoId) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      try {
        await api.patch(`/api/pedidos/${pedidoId}/cancelar`);
        alert('Pedido cancelado com sucesso.');
        const response = await api.get('/api/pedidos/meus-pedidos');
        setPedidos(response.data);
      } catch (err) {
        alert(err.response?.data?.message || 'Não foi possível cancelar o pedido.');
      }
    }
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('imagem_perfil', file);
    try {
      await api.put(`/api/auth/${user.id}/imagem`, data);
      alert('Imagem de perfil atualizada! Por favor, faça login novamente para ver a alteração.');
      logout();
    } catch (error) {
      alert('Erro ao atualizar a imagem.');
      console.error(error);
    }
  };

  const handleShowDetails = (pedidoId) => {
    setSelectedPedidoId(pedidoId);
    setShowDetailsModal(true);
  };

  const profileImageUrl = user?.imagem_perfil_url
    ? `http://localhost:3001/uploads/${user.imagem_perfil_url}`
    : 'https://placehold.co/150';

  // ✅ 1. LÓGICA DE FILTRAGEM ATUALIZADA
  const pedidosEmAndamento = pedidos.filter(p => p.status === 'Processando' || p.status === 'Enviado' || p.status === 'Aguardando Aprovação Boleto' || p.status === 'Boleto em Pagamento');
  const pedidosConcluidos = pedidos.filter(p => p.status === 'Entregue' || p.status === 'Cancelado' || p.status === 'Boleto Negado');
  const pedidosFiado = pedidos.filter(p => p.status === 'Fiado'); // Nova lista para fiados

  if (isAuthLoading || loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }
  
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <h1 className="mb-4">Meu Painel</h1>
      
      <div className="row">
        <div className="col-lg-7 mb-4">
          <div className="card h-100">
            <div className="card-header"><h4>Minhas Informações</h4></div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-3 text-center">
                  <img src={profileImageUrl} alt="Foto de Perfil" className="img-fluid rounded-circle" style={{ maxWidth: '100px' }}/>
                </div>
                <div className="col-md-9">
                  <h5 className="card-title">{user?.nome}</h5>
                  <p className="card-text mb-0"><strong>Email:</strong> {user?.email || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-5 mb-4">
          <div className="card h-100">
            <div className="card-header"><h4>Configurações</h4></div>
            <div className="card-body d-flex flex-column justify-content-center align-items-start">
              <button className="btn btn-secondary" onClick={() => setShowEditProfileModal(true)}>
                Editar Perfil e Senha
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mt-4">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'andamento' ? 'active' : ''}`} onClick={() => setActiveTab('andamento')}>
                Pedidos em Andamento ({pedidosEmAndamento.length})
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'concluidos' ? 'active' : ''}`} onClick={() => setActiveTab('concluidos')}>
                Histórico de Compras ({pedidosConcluidos.length})
              </button>
            </li>
            {/* ✅ 2. NOVA ABA DE FIADO (só aparece se houver pedidos fiado) */}
            {pedidosFiado.length > 0 && (
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'fiado' ? 'active' : ''}`} onClick={() => setActiveTab('fiado')}>
                  Pedidos Fiado <span className="badge bg-danger">{pedidosFiado.length}</span>
                </button>
              </li>
            )}
          </ul>
        </div>
        <div className="card-body">
          {activeTab === 'andamento' && (
            <div>
              <h4 className="card-title">Seus Pedidos Atuais</h4>
              <p className="card-subtitle mb-3 text-muted">Acompanhe os pedidos que ainda não foram entregues.</p>
              <OrderList 
                pedidos={pedidosEmAndamento} 
                onShowDetails={handleShowDetails} 
                onCancelarPedido={handleCancelarPedido} 
              />
            </div>
          )}
          {activeTab === 'concluidos' && (
            <div>
              <h4 className="card-title">Seu Histórico</h4>
              <p className="card-subtitle mb-3 text-muted">Veja todas as suas compras já finalizadas ou canceladas.</p>
              <OrderList 
                pedidos={pedidosConcluidos} 
                onShowDetails={handleShowDetails} 
              />
            </div>
          )}
          {/* ✅ 3. CONTEÚDO DA NOVA ABA DE FIADO */}
          {activeTab === 'fiado' && (
            <div>
              <h4 className="card-title">Suas Compras em Aberto (Fiado)</h4>
              <p className="card-subtitle mb-3 text-muted">Estes são os pedidos que aguardam o pagamento completo.</p>
              <OrderList 
                pedidos={pedidosFiado} 
                onShowDetails={handleShowDetails} 
              />
            </div>
          )}
        </div>
      </div>
      
      <CustomerOrderDetailsModal 
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        pedidoId={selectedPedidoId}
      />

      <EditProfileModal 
        show={showEditProfileModal}
        onHide={() => setShowEditProfileModal(false)}
      />
    </div>
  );
}

export default CustomerDashboard;