// src/pages/CustomerDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import api from '../services/api';
import OrderList from '../components/OrderList';
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';
import EditProfileModal from '../components/EditProfileModal';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination'; // ✅ 1. Importa o componente de Paginação

function CustomerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isEnabled } = useFeatureFlags();

  const [activeView, setActiveView] = useState('andamento');
  const [counts, setCounts] = useState({ andamento: 0, historico: 0, fiado: 0, boletos: 0 });
  const [pedidos, setPedidos] = useState([]);
  const [pedidosBoleto, setPedidosBoleto] = useState([]);
  const [comandasAbertas, setComandasAbertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // ✅ 2. Novo estado para controlar a página da lista de conteúdo
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Limite de 5 itens por página

  useEffect(() => {
    const fetchAllData = async () => {
      if (!isAuthLoading && user) {
        setLoading(true);
        try {
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
      }
    };
    fetchAllData();
  }, [user, isAuthLoading]);
  
  // ✅ 3. Reseta para a primeira página sempre que a 'activeView' muda
  useEffect(() => {
    setCurrentPage(1);
  }, [activeView]);

  const handleCancelarPedido = async (pedidoId) => { /* ... sua função aqui ... */ };
  const handleShowDetails = (pedidoId) => {
    setSelectedPedidoId(pedidoId);
    setShowDetailsModal(true);
  };

  const profileImageUrl = user?.imagem_perfil_url ? `http://localhost:3001/uploads/${user.imagem_perfil_url}` : 'https://placehold.co/150';

  const pedidosEmAndamento = pedidos.filter(p => ['Processando', 'Enviado', 'Aguardando Aprovação Boleto', 'Boleto em Pagamento'].includes(p.status));
  const pedidosConcluidos = pedidos.filter(p => ['Entregue', 'Cancelado', 'Boleto Negado'].includes(p.status));
  const pedidosFiado = pedidos.filter(p => p.status === 'Fiado');
  
  // ✅ 4. Lógica para selecionar a lista correta e calcular a paginação
  let currentList = [];
  switch (activeView) {
      case 'andamento': currentList = pedidosEmAndamento; break;
      case 'historico': currentList = pedidosConcluidos; break;
      case 'fiado': currentList = pedidosFiado; break;
      case 'boletos': currentList = pedidosBoleto; break;
      default: currentList = [];
  }
  const totalPages = Math.ceil(currentList.length / itemsPerPage);
  const paginatedItems = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  if (isAuthLoading || loading) { return <div className="text-center my-5"><div className="spinner-border" /></div>; }
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <h1 className="mb-4">Meu Painel</h1>
      <div className="row mb-4">
        <div className="col-lg-7 mb-4 mb-lg-0">
          <div className="card h-100">
            <div className="card-header"><h4>Minhas Informações</h4></div>
            <div className="card-body">
              <div className="d-flex flex-column flex-md-row align-items-center">
                <img src={profileImageUrl} alt="Foto de Perfil" className="rounded-circle mb-3 mb-md-0 me-md-4" style={{ width: '120px', height: '120px', objectFit: 'cover' }}/>
                <div className="flex-grow-1" style={{minWidth: 0}}>
                  <h5 className="card-title">{user?.nomeCompleto}</h5>
                  <p className="card-text mb-1"><strong>Email:</strong> <span className="text-break">{user?.usuario || 'Não informado'}</span></p>
                  <p className="card-text mb-1"><strong>Telefone:</strong> {user?.telefone || 'Não informado'}</p>
                  <p className="card-text mb-1"><strong>CPF:</strong> {user?.cpf || 'Não informado'}</p>
                  <button className="btn btn-secondary btn-sm mt-2" onClick={() => setShowEditProfileModal(true)}>Editar Perfil</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header"><h4>Informações e Ações</h4></div>
            <div className="card-body d-grid gap-3">
                <button className={`btn btn-lg ${activeView === 'andamento' ? 'btn-primary' : 'btn-outline-primary'} d-flex justify-content-between align-items-center`} onClick={() => setActiveView('andamento')}>
                    Pedidos em Andamento <span className="badge bg-light text-dark">{pedidosEmAndamento.length}</span>
                </button>
                <button className={`btn btn-lg ${activeView === 'historico' ? 'btn-primary' : 'btn-outline-primary'} d-flex justify-content-between align-items-center`} onClick={() => setActiveView('historico')}>
                    Histórico de Compras <span className="badge bg-light text-dark">{pedidosConcluidos.length}</span>
                </button>
                {isEnabled('sistema_fiado') && pedidosFiado.length > 0 && (
                    <button className={`btn btn-lg ${activeView === 'fiado' ? 'btn-danger' : 'btn-outline-danger'} d-flex justify-content-between align-items-center`} onClick={() => setActiveView('fiado')}>
                        Pedidos Fiado <span className="badge bg-light text-dark">{pedidosFiado.length}</span>
                    </button>
                )}
                {isEnabled('sistema_boleto') && pedidosBoleto.length > 0 && (
                    <button className={`btn btn-lg ${activeView === 'boletos' ? 'btn-dark' : 'btn-outline-dark'} d-flex justify-content-between align-items-center`} onClick={() => setActiveView('boletos')}>
                        Meus Boletos <span className="badge bg-light text-white">{pedidosBoleto.length}</span>
                    </button>
                )}
                {comandasAbertas.length > 0 && (
                    <Link to="/minhas-comandas" className="btn btn-lg btn-info d-flex justify-content-between align-items-center">
                        Comandas em Aberto <span className="badge bg-light text-dark">{comandasAbertas.length}</span>
                    </Link>
                )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
            {activeView === 'andamento' && <OrderList title="Pedidos em Andamento" pedidos={paginatedItems} onShowDetails={handleShowDetails} showCancelButton={true} />}
            {activeView === 'historico' && <OrderList title="Histórico de Compras" pedidos={paginatedItems} onShowDetails={handleShowDetails} />}
            {activeView === 'fiado' && <OrderList title="Suas Compras em Aberto (Fiado)" pedidos={paginatedItems} onShowDetails={handleShowDetails} />}
            {activeView === 'boletos' && <OrderList title="Meus Carnês de Boleto" pedidos={paginatedItems} onShowDetails={handleShowDetails} isBoletoList={true} />}
        </div>
        {/* ✅ 5. Adiciona o componente de paginação, que só aparece se houver mais de uma página */}
        {totalPages > 1 && (
            <div className="card-footer d-flex justify-content-center">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>
        )}
      </div>
      
      <CustomerOrderDetailsModal show={showDetailsModal} onHide={() => setSelectedPedidoId(null)} pedidoId={selectedPedidoId}/>
      <EditProfileModal show={showEditProfileModal} onHide={() => setShowEditProfileModal(false)} onSave={() => window.location.reload()}/>
    </div>
  );
}

export default CustomerDashboard;