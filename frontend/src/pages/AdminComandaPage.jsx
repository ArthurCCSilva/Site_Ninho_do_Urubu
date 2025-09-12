// src/pages/AdminComandaPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import CriarComandaModal from '../components/CriarComandaModal';
import AddProductToComandaModal from '../components/AddProductToComandaModal';
import FecharComandaModal from '../components/FecharComandaModal';
import ComandaDetailsModal from '../components/ComandaDetailsModal'; // ✅ Importa o novo modal

function AdminComandaPage() {
    const [comandas, setComandas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCriarModal, setShowCriarModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showFecharModal, setShowFecharModal] = useState(false);
    const [selectedComanda, setSelectedComanda] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const fetchComandas = async () => {
        setLoading(true);
        try {
            // ✅ 2. Adiciona o parâmetro de busca na chamada da API
            const params = new URLSearchParams({ search: searchTerm });
            const response = await api.get(`/api/comandas?${params.toString()}`);
            setComandas(response.data);
        } catch (err) {
            console.error("Erro ao buscar comandas", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounceFetch = setTimeout(() => {
            fetchComandas();
        }, 500); // Espera 500ms após o usuário parar de digitar
        
        return () => clearTimeout(debounceFetch);
    }, [searchTerm]);

    const handleShowAddProduct = (comanda) => {
        setSelectedComanda(comanda);
        setShowAddProductModal(true);
    };

    const handleShowFechar = (comanda) => {
        setSelectedComanda(comanda);
        setShowFecharModal(true);
    };

    // ✅ Nova função para mostrar os detalhes
    const handleShowDetails = (comanda) => {
        setSelectedComanda(comanda);
        setShowDetailsModal(true);
    };

    const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Comandas em Aberto</h1>
                <button className="btn btn-primary" onClick={() => setShowCriarModal(true)}>
                    + Abrir Nova Comanda
                </button>
            </div>

            <div className="card card-body mb-4">
                <input 
                    type="text" 
                    className="form-control"
                    placeholder="Pesquisar por nome do cliente ou localização..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {loading ? <div className="text-center"><div className="spinner-border"/></div> :
            <div className="row">
                {comandas.length > 0 ? comandas.map(comanda => (
                    <div className="col-md-6 col-lg-4 mb-4" key={comanda.id}>
                        <div className="card h-100">
                            <div className="card-body d-flex flex-column">
                                <div className="mb-2">
                                    <h5 className="card-title d-inline">Comanda #{comanda.id}</h5>
                                    {/* ✅ NOVO BOTÃO DE DETALHES */}
                                    <button className="btn btn-outline-secondary btn-sm float-end" onClick={() => handleShowDetails(comanda)}>Ver Itens</button>
                                </div>
                                <p className="card-text mb-1"><strong>Cliente:</strong> {comanda.cliente_nome} {comanda.nome_cliente_avulso ? `(${comanda.nome_cliente_avulso})` : ''}</p>
                                <p className="card-text mb-1"><strong>Itens:</strong> {comanda.total_itens || 0}</p>
                                <p className="card-text mt-auto pt-2"><strong>Valor Parcial: <span className="fs-5">{formatCurrency(comanda.valor_total)}</span></strong></p>
                            </div>
                            <div className="card-footer d-flex justify-content-between">
                                <button className="btn btn-secondary btn-sm" onClick={() => handleShowAddProduct(comanda)}>+ Adicionar Produto</button>
                                <button className="btn btn-success btn-sm" onClick={() => handleShowFechar(comanda)}>Fechar Comanda</button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <p className="text-muted">Nenhuma comanda em aberto.</p>
                )}
            </div>
            }

            <CriarComandaModal 
                show={showCriarModal} 
                onHide={() => setShowCriarModal(false)} 
                onSave={() => {
                    setShowCriarModal(false);
                    fetchComandas();
                }} 
            />
            <AddProductToComandaModal 
                show={showAddProductModal} 
                onHide={() => setShowAddProductModal(false)} 
                onSave={() => {
                    setShowAddProductModal(false);
                    fetchComandas();
                }} 
                comanda={selectedComanda} 
            />
            <FecharComandaModal 
                show={showFecharModal}
                onHide={() => setShowFecharModal(false)}
                onSave={() => {
                    setShowFecharModal(false);
                    fetchComandas();
                }}
                comanda={selectedComanda}
            />
            <ComandaDetailsModal 
                show={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                comandaId={selectedComanda?.id}
                onUpdate={fetchComandas}
            />
        </div>
    );
}
export default AdminComandaPage;