// src/pages/AdminBoletosPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import BoletoDaysModal from '../components/BoletoDaysModal';
import OrderDetailsModal from '../components/OrderDetailsModal';

function AdminBoletosPage() {
    const [pedidosAprovacao, setPedidosAprovacao] = useState([]);
    const [parcelasAbertas, setParcelasAbertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBoletoDaysModal, setShowBoletoDaysModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const fetchAllData = () => {
        setLoading(true);
        const fetchAprovacoes = api.get('/api/boletos/pendentes-aprovacao');
        const params = new URLSearchParams({ page: currentPage, limit: 10, search: searchTerm });
        const fetchParcelas = api.get(`/api/boletos/parcelas-em-aberto?${params.toString()}`);
        Promise.all([fetchAprovacoes, fetchParcelas])
            .then(([aprovacoesRes, parcelasRes]) => {
                setPedidosAprovacao(aprovacoesRes.data);
                setParcelasAbertas(parcelasRes.data.parcelas);
                setTotalPages(parcelasRes.data.totalPages);
            })
            .catch(err => console.error("Erro ao buscar dados de boletos", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const debounceFetch = setTimeout(() => {
            if (currentPage !== 1) { setCurrentPage(1); }
            else { fetchAllData(); }
        }, 500);
        return () => clearTimeout(debounceFetch);
    }, [searchTerm]);

    useEffect(() => {
        fetchAllData();
    }, [currentPage]);

    const handleMarcarPaga = async (parcelaId) => {
        if (window.confirm("Confirmar o pagamento desta parcela?")) {
            try {
                await api.patch(`/api/boletos/parcela/${parcelaId}/marcar-paga`);
                alert("Parcela paga com sucesso!");
                fetchAllData();
            } catch (err) { alert(err.response?.data?.message || "Erro ao pagar parcela."); }
        }
    };
    
    const handleAprovar = async (pedidoId) => {
        if (window.confirm("Aprovar este pedido de boleto? O status mudará para 'Boleto em Pagamento'.")) {
            try {
                await api.patch(`/api/pedidos/${pedidoId}/status`, { status: 'Boleto em Pagamento' });
                alert("Pedido aprovado!");
                fetchAllData();
            } catch (err) { alert(err.response?.data?.message || "Erro ao aprovar pedido."); }
        }
    };
    
    const handleReprovar = async (pedidoId) => {
        if (window.confirm("REPROVAR este pedido de boleto? O status será alterado para 'Boleto Negado'.")) {
            try {
                await api.patch(`/api/pedidos/${pedidoId}/status`, { status: 'Boleto Negado' });
                alert("Pedido de boleto reprovado.");
                fetchAllData();
            } catch (err) { alert(err.response?.data?.message || "Erro ao reprovar pedido."); }
        }
    };

    const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleShowDetails = (pedidoId) => {
        setSelectedOrderId(pedidoId);
        setShowDetailsModal(true);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1>Gerenciamento de Boletos</h1>
              <button className="btn btn-outline-dark" onClick={() => setShowBoletoDaysModal(true)}>
                Gerenciar Dias de Vencimento
              </button>
            </div>

            <div className="card mb-4">
                <div className="card-header"><h5>Pedidos Aguardando Aprovação</h5></div>
                <div className="card-body">
                    {loading ? <div className="text-center"><div className="spinner-border spinner-border-sm" /></div> :
                        pedidosAprovacao.length > 0 ? (
                            <ul className="list-group">{pedidosAprovacao.map(p => (
                                <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                                    <div className="me-3 mb-2 mb-md-0">
                                        <strong>Pedido #{p.id}</strong> - {p.cliente_nome} ({formatCurrency(p.valor_total)})
                                    </div>
                                    <div className="d-flex">
                                        <button className="btn btn-secondary btn-sm me-2" onClick={() => handleShowDetails(p.id)}>Ver Detalhes</button>
                                        <button className="btn btn-danger btn-sm me-2" onClick={() => handleReprovar(p.id)}>Reprovar</button>
                                        <button className="btn btn-success btn-sm" onClick={() => handleAprovar(p.id)}>Aprovar</button>
                                    </div>
                                </li>
                            ))}</ul>
                        ) : <p className="text-muted">Nenhum pedido aguardando aprovação.</p>}
                </div>
            </div>
            
            <div className="card">
                <div className="card-header"><h5>Parcelas de Boletos em Aberto</h5></div>
                <div className="card-body">
                    <input type="text" className="form-control mb-3" placeholder="Pesquisar por cliente (nome, email, cpf)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    {loading ? <div className="text-center"><div className="spinner-border spinner-border-sm" /></div> :
                        parcelasAbertas.length > 0 ? (
                            <div className="table-responsive"><table className="table table-sm table-hover align-middle">
                                <thead><tr><th>Cliente</th><th>Pedido ID</th><th>Parcela</th><th>Vencimento</th><th className="text-end">Valor</th><th>Ação</th></tr></thead>
                                <tbody>{parcelasAbertas.map(parc => {
                                    const isVencida = new Date(parc.data_vencimento) < new Date() && parc.status === 'pendente';
                                    return (
                                        <tr key={parc.id} className={isVencida ? 'table-danger' : ''}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <img src={parc.imagem_perfil_url ? `http://localhost:3001/uploads/${parc.imagem_perfil_url}` : 'https://placehold.co/40'} alt={parc.cliente_nome} className="rounded-circle me-2" style={{width: 40, height: 40, objectFit: 'cover'}}/>
                                                    {parc.cliente_nome}
                                                </div>
                                            </td>
                                            <td><button className="btn btn-link p-0" onClick={() => handleShowDetails(parc.pedido_id)}>#{parc.pedido_id}</button></td>
                                            <td>{parc.numero_parcela}</td>
                                            <td>{new Date(parc.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} {isVencida && <span className="badge bg-danger ms-2">Vencida</span>}</td>
                                            <td className="text-end">{formatCurrency(parc.valor)}</td>
                                            <td><button className="btn btn-primary btn-sm" onClick={() => handleMarcarPaga(parc.id)}>Marcar como Paga</button></td>
                                        </tr>
                                    );
                                })}</tbody>
                            </table></div>
                        ) : <p className="text-muted">Nenhuma parcela em aberto encontrada.</p>}
                </div>
                <div className="card-footer d-flex justify-content-center">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>

            <BoletoDaysModal 
                show={showBoletoDaysModal}
                onHide={() => setShowBoletoDaysModal(false)}
            />
            <OrderDetailsModal
                show={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                pedidoId={selectedOrderId}
                onOrderUpdate={fetchAllData}
            />
        </div>
    );
}

export default AdminBoletosPage;