// src/pages/CustomerDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OrderList from '../components/OrderList';
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';
import EditProfileModal from '../components/EditProfileModal';
import { Link } from 'react-router-dom'; // ✅ 1. Garante que o Link está importado

function CustomerDashboard() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [pedidosBoleto, setPedidosBoleto] = useState([]);
  const [comandasAbertas, setComandasAbertas] = useState([]); // ✅ 2. Novo estado para comandas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('andamento');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!isAuthLoading && user) {
        try {
          setLoading(true);
          // ✅ 3. Busca todos os dados do cliente em paralelo
          const [pedidosRes, boletosRes, comandasRes] = await Promise.all([
            api.get('/api/pedidos/meus-pedidos'),
            api.get('/api/pedidos/meus-boletos'),
            api.get('/api/usuarios/minhas-comandas')
          ]);
          setPedidos(pedidosRes.data);
          setPedidosBoleto(boletosRes.data);
          setComandasAbertas(comandasRes.data);
        } catch (err) {
          setError('Não foi possível carregar seus dados.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else if (!isAuthLoading && !user) {
        setLoading(false);
        setPedidos([]);
        setPedidosBoleto([]);
        setComandasAbertas([]);
      }
    };
    fetchAllData();
  }, [user, isAuthLoading]);

  const handleCancelarPedido = async (pedidoId) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      try {
        await api.patch(`/api/pedidos/${pedidoId}/cancelar`);
        alert('Pedido cancelado com sucesso.');
        const [pedidosRes, boletosRes, comandasRes] = await Promise.all([
            api.get('/api/pedidos/meus-pedidos'),
            api.get('/api/pedidos/meus-boletos'),
            api.get('/api/usuarios/minhas-comandas')
        ]);
        setPedidos(pedidosRes.data);
        setPedidosBoleto(boletosRes.data);
        setComandasAbertas(comandasRes.data);
      } catch (err) {
        alert(err.response?.data?.message || 'Não foi possível cancelar o pedido.');
      }
    }
  };

  const handleShowDetails = (pedidoId) => {
    setSelectedPedidoId(pedidoId);
    setShowDetailsModal(true);
  };

  const profileImageUrl = user?.imagem_perfil_url
    ? `http://localhost:3001/uploads/${user.imagem_perfil_url}`
    : 'https://placehold.co/150';

  const pedidosEmAndamento = pedidos.filter(p => p.status === 'Processando' || p.status === 'Enviado' || p.status === 'Aguardando Aprovação Boleto' || p.status === 'Boleto em Pagamento');
  const pedidosConcluidos = pedidos.filter(p => p.status === 'Entregue' || p.status === 'Cancelado' || p.status === 'Boleto Negado');
  const pedidosFiado = pedidos.filter(p => p.status === 'Fiado');
  
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
                  <img src={profileImageUrl} alt="Foto de Perfil" className="img-fluid rounded-circle" style={{ maxWidth: '100px', height: '100px', objectFit: 'cover' }}/>
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
            {/* ✅ 4. TÍTULO DO CARD ATUALIZADO */}
            <div className="card-header"><h4>Informações e Ações</h4></div>
            <div className="card-body d-flex flex-column justify-content-center align-items-start">
              <button className="btn btn-secondary mb-3" onClick={() => setShowEditProfileModal(true)}>
                Editar Perfil e Senha
              </button>
              {/* ✅ 5. BOTÃO COMANDA (só aparece se tiver comanda) */}
              {comandasAbertas.length > 0 && (
                <Link to="/minhas-comandas" className="btn btn-info">
                  Comandas em Aberto <span className="badge bg-danger">{comandasAbertas.length}</span>
                </Link>
              )}
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

      {pedidosBoleto.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h4>Meus Boletos (Carnês)</h4>
          </div>
          <div className="card-body">
            <p className="card-subtitle mb-3 text-muted">Acompanhe aqui o pagamento dos seus parcelamentos.</p>
            <div className="list-group">
              {pedidosBoleto.map(pedido => (
                <div key={pedido.id} className="list-group-item list-group-item-action">
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">Pedido #{pedido.id}</h5>
                    <small>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</small>
                  </div>
                  <p className="mb-1">
                    <strong>Status:</strong> 
                    <span className={`badge ${pedido.status === 'Entregue' ? 'bg-success' : 'bg-primary'}`}>{pedido.status}</span>
                  </p>
                  <p className="mb-1">
                    <strong>Valor Total:</strong> {parseFloat(pedido.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <div className="mt-2">
                    <button className="btn btn-info btn-sm" onClick={() => handleShowDetails(pedido.id)}>
                      Ver Carnê
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
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