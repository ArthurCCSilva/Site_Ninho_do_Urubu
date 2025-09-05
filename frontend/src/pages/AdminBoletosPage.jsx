// src/pages/AdminBoletosPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import BoletoDaysModal from '../components/BoletoDaysModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from "react-datepicker";
import ptBR from 'date-fns/locale/pt-BR';
registerLocale('pt-BR', ptBR);

function AdminBoletosPage() {
    const [activeTab, setActiveTab] = useState('aprovacao');
    const [pedidosAprovacao, setPedidosAprovacao] = useState([]);
    const [carnesAbertos, setCarnesAbertos] = useState([]);
    const [pedidosNegados, setPedidosNegados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBoletoDaysModal, setShowBoletoDaysModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [parcelasSelecionadas, setParcelasSelecionadas] = useState({});

    // Funções de busca separadas para cada aba
    const fetchAprovacoes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/boletos/pendentes-aprovacao');
            setPedidosAprovacao(response.data);
        } catch (err) { console.error("Erro ao buscar aprovações", err); }
        finally { setLoading(false); }
    };

    const fetchCarnes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: currentPage, limit: 10, search: searchTerm });
            const response = await api.get(`/api/boletos/carnes-em-aberto?${params.toString()}`);
            setCarnesAbertos(response.data.carnes);
            setTotalPages(response.data.totalPages);
            setCurrentPage(response.data.currentPage);
        } catch (err) { console.error("Erro ao buscar carnês", err); }
        finally { setLoading(false); }
    };

    const fetchNegados = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/boletos/negados');
            setPedidosNegados(response.data);
        } catch (err) { console.error("Erro ao buscar boletos negados", err); }
        finally { setLoading(false); }
    };
    
    // useEffect principal que controla qual dado buscar
    useEffect(() => {
        const fetchDataForCurrentTab = () => {
            if (activeTab === 'aprovacao') {
                fetchAprovacoes();
            } else if (activeTab === 'aberto') {
                fetchCarnes();
            } else if (activeTab === 'negado') {
                fetchNegados();
            }
        };

        const debounceFetch = setTimeout(() => {
            fetchDataForCurrentTab();
        }, 300);

        return () => clearTimeout(debounceFetch);
    }, [activeTab, currentPage, searchTerm]);

    // Reseta a página para 1 quando a aba ou o termo de busca mudam
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    // Handlers para as ações
    const handleAprovar = async (pedidoId) => {
        if (window.confirm("Aprovar este pedido de boleto? O status mudará para 'Boleto em Pagamento'.")) {
            try {
                await api.patch(`/api/pedidos/${pedidoId}/status`, { status: 'Boleto em Pagamento' });
                alert("Pedido aprovado!");
                fetchAprovacoes(); // Recarrega a lista da aba atual
            } catch (err) { alert(err.response?.data?.message || "Erro ao aprovar pedido."); }
        }
    };
    
    const handleReprovar = async (pedidoId) => {
        if (window.confirm("REPROVAR este pedido? O status mudará e o estoque será devolvido.")) {
            try {
                await api.patch(`/api/pedidos/${pedidoId}/status`, { status: 'Boleto Negado' });
                alert("Pedido de boleto reprovado.");
                fetchAprovacoes(); // Recarrega a lista da aba atual
            } catch (err) { alert(err.response?.data?.message || "Erro ao reprovar pedido."); }
        }
    };

    const handleParcelaCheckboxChange = (pedidoId, parcelaId) => {
        const selecionadasAtualmente = parcelasSelecionadas[pedidoId] || [];
        let novasSelecionadas = selecionadasAtualmente.includes(parcelaId)
            ? selecionadasAtualmente.filter(id => id !== parcelaId)
            : [...selecionadasAtualmente, parcelaId];
        setParcelasSelecionadas({ ...parcelasSelecionadas, [pedidoId]: novasSelecionadas });
    };

    const handleMarcarMultiplasPagas = async (pedidoId) => {
        const idsParaPagar = parcelasSelecionadas[pedidoId];
        if (!idsParaPagar || idsParaPagar.length === 0) {
            return alert("Nenhuma parcela selecionada.");
        }
        if (window.confirm(`Confirmar o pagamento de ${idsParaPagar.length} parcela(s)?`)) {
            try {
                await api.post('/api/boletos/parcelas/marcar-pagas', { parcelaIds: idsParaPagar });
                alert("Parcelas pagas com sucesso!");
                setParcelasSelecionadas({ ...parcelasSelecionadas, [pedidoId]: [] });
                fetchCarnes(); // Recarrega a lista da aba atual
            } catch (err) {
                alert(err.response?.data?.message || "Erro ao pagar parcelas.");
            }
        }
    };

    const handleShowDetails = (pedidoId) => {
        setSelectedOrderId(pedidoId);
        setShowDetailsModal(true);
    };

    const handleDateChange = async (parcelaId, novaData) => {
        try {
            await api.patch(`/api/boletos/parcela/${parcelaId}/atualizar-vencimento`, { novaData });
            fetchCarnes(); // Recarrega a lista da aba atual
        } catch (err) {
            alert("Erro ao atualizar data de vencimento.");
        }
    };

    const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const refreshCurrentTabData = () => {
        if (activeTab === 'aprovacao') fetchAprovacoes();
        else if (activeTab === 'aberto') fetchCarnes();
        else if (activeTab === 'negado') fetchNegados();
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1>Gerenciamento de Boletos</h1>
              <button className="btn btn-outline-dark" onClick={() => setShowBoletoDaysModal(true)}>
                Gerenciar Dias de Vencimento
              </button>
            </div>
            
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item"><a className={`nav-link ${activeTab === 'aberto' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('aberto'); }}>Carnês em Aberto</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab === 'aprovacao' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('aprovacao'); }}>Aguardando Aprovação</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab === 'negado' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('negado'); }}>Boletos Negados</a></li>
            </ul>

            <div className="tab-content">
                {activeTab === 'aprovacao' && (
                    <div className="card">
                        <div className="card-header"><h5>Pedidos Aguardando Aprovação</h5></div>
                        <div className="card-body">
                            {loading ? <div className="text-center"><div className="spinner-border spinner-border-sm" /></div> :
                                pedidosAprovacao.length > 0 ? (
                                    <ul className="list-group">{pedidosAprovacao.map(p => (
                                        <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                                            <div className="me-3 mb-2 mb-md-0"><strong>Pedido #{p.id}</strong> - {p.cliente_nome} ({formatCurrency(p.valor_total)})</div>
                                            <div className="d-flex"><button className="btn btn-info btn-sm me-2" onClick={() => handleShowDetails(p.id)}>Ver Carnê</button><button className="btn btn-danger btn-sm me-2" onClick={() => handleReprovar(p.id)}>Reprovar</button><button className="btn btn-success btn-sm" onClick={() => handleAprovar(p.id)}>Aprovar</button></div>
                                        </li>
                                    ))}</ul>
                                ) : <p className="text-muted">Nenhum pedido aguardando aprovação.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'aberto' && (
                    <div className="card">
                        <div className="card-header"><h5>Carnês em Aberto</h5></div>
                        <div className="card-body">
                            <input type="text" className="form-control mb-3" placeholder="Pesquisar por cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            {loading ? <div className="text-center"><div className="spinner-border"/></div> :
                                carnesAbertos.length > 0 ? (
                                    <div className="accordion" id="carnesAccordion">
                                        {carnesAbertos.map((carne, index) => (
                                            <div className="accordion-item" key={carne.pedido_id}>
                                                <h2 className="accordion-header" id={`heading-${index}`}>
                                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${index}`}>
                                                        <img src={carne.imagem_perfil_url ? `http://localhost:3001/uploads/${carne.imagem_perfil_url}`: 'https://placehold.co/40'} alt={carne.cliente_nome} className="rounded-circle me-3" style={{width: 40, height: 40, objectFit: 'cover'}}/>
                                                        <strong>{carne.cliente_nome}</strong>&nbsp;- Pedido #{carne.pedido_id} ({formatCurrency(carne.valor_total)})
                                                    </button>
                                                </h2>
                                                <div id={`collapse-${index}`} className="accordion-collapse collapse" data-bs-parent="#carnesAccordion">
                                                    <div className="accordion-body">
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                          <button className="btn btn-sm btn-info" onClick={() => handleShowDetails(carne.pedido_id)}>Ver Produtos do Pedido</button>
                                                          <button className="btn btn-sm btn-primary" onClick={() => handleMarcarMultiplasPagas(carne.pedido_id)} disabled={!parcelasSelecionadas[carne.pedido_id] || parcelasSelecionadas[carne.pedido_id].length === 0}>
                                                            Pagar Selecionadas ({parcelasSelecionadas[carne.pedido_id]?.length || 0})
                                                          </button>
                                                        </div>
                                                        <div className="table-responsive">
                                                            <table className="table table-sm">
                                                                <thead><tr><th style={{width: "5%"}}></th><th>Parcela</th><th>Vencimento</th><th className="text-end">Valor</th><th>Status</th></tr></thead>
                                                                <tbody>{carne.parcelas.map(parc => {
                                                                    const isVencida = new Date(parc.data_vencimento) < new Date() && parc.status === 'pendente';
                                                                    return (<tr key={parc.id} className={isVencida ? 'table-danger' : ''}>
                                                                        <td>
                                                                            {parc.status === 'pendente' && (
                                                                                <input type="checkbox" className="form-check-input" checked={parcelasSelecionadas[carne.pedido_id]?.includes(parc.id) || false} onChange={() => handleParcelaCheckboxChange(carne.pedido_id, parc.id)} />
                                                                            )}
                                                                        </td>
                                                                        <td>{parc.numero_parcela}</td>
                                                                        <td><DatePicker selected={new Date(parc.data_vencimento)} onChange={(date) => handleDateChange(parc.id, date)} className="form-control form-control-sm" dateFormat="dd/MM/yyyy" locale="pt-BR" /></td>
                                                                        <td className="text-end">{formatCurrency(parc.valor)}</td>
                                                                        <td><span className={`badge ${parc.status === 'pago' ? 'bg-success' : 'bg-warning text-dark'}`}>{parc.status}</span></td>
                                                                    </tr>);
                                                                })}</tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-muted">Nenhum carnê em aberto encontrado.</p>}
                        </div>
                        <div className="card-footer d-flex justify-content-center">
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>
                    </div>
                )}
                
                {activeTab === 'negado' && (
                     <div className="card">
                        <div className="card-header"><h5>Boletos Negados</h5></div>
                        <div className="card-body">
                            {loading ? <div className="text-center"><div className="spinner-border spinner-border-sm" /></div> :
                                pedidosNegados.length > 0 ? (
                                    <ul className="list-group">{pedidosNegados.map(p => (
                                        <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                                            <div><strong>Pedido #{p.id}</strong> - {p.cliente_nome} ({formatCurrency(p.valor_total)})</div>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleShowDetails(p.id)}>Ver Detalhes</button>
                                        </li>
                                    ))}</ul>
                                ) : <p className="text-muted">Nenhum boleto negado encontrado.</p>}
                        </div>
                    </div>
                )}
            </div>

            <BoletoDaysModal show={showBoletoDaysModal} onHide={() => setShowBoletoDaysModal(false)} />
            <OrderDetailsModal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} pedidoId={selectedOrderId} onOrderUpdate={refreshCurrentTabData} />
        </div>
    );
}

export default AdminBoletosPage;