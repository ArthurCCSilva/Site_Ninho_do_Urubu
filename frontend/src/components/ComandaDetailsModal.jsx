// src/components/ComandaDetailsModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';

function ComandaDetailsModal({ show, onHide, comandaId, onUpdate }) {
    const [comanda, setComanda] = useState(null);
    const [loading, setLoading] = useState(false);
    const modalRef = useRef();

    const fetchDetails = async () => {
        if (!comandaId) return;
        setLoading(true);
        try {
            const response = await api.get(`/api/comandas/${comandaId}`);
            setComanda(response.data);
        } catch (err) {
            console.error("Erro ao buscar detalhes da comanda", err);
            onHide(); // Fecha o modal se houver erro
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const modalElement = modalRef.current;
        const bsModal = Modal.getOrCreateInstance(modalElement);
        if (show) {
            fetchDetails();
            bsModal.show();
        } else {
            bsModal.hide();
        }
    }, [show, comandaId]);

    const handleUpdateQuantity = async (itemId, novaQuantidade) => {
        if (novaQuantidade < 1) return handleRemoveItem(itemId);
        try {
            await api.put(`/api/comandas/item/${itemId}`, { novaQuantidade });
            fetchDetails(); // Recarrega os detalhes
            onUpdate(); // Atualiza a lista principal de comandas
        } catch (err) { alert(err.response?.data?.message || "Erro ao atualizar quantidade."); }
    };

    const handleRemoveItem = async (itemId) => {
        if (window.confirm("Tem certeza que deseja remover este item da comanda?")) {
            try {
                await api.delete(`/api/comandas/item/${itemId}`);
                fetchDetails();
                onUpdate();
            } catch (err) { alert(err.response?.data?.message || "Erro ao remover item."); }
        }
    };

    const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valorTotal = comanda?.itens?.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0) || 0;

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Detalhes da Comanda #{comandaId}</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        {loading ? <div className="text-center"><div className="spinner-border"/></div> :
                        <>
                            <div className="list-group mb-3">
                                {comanda?.itens?.map(item => (
                                    <div key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <img src={item.imagem_produto_url ? `http://localhost:3001/uploads/${item.imagem_produto_url}` : 'https://placehold.co/60'} alt={item.produto_nome} className="img-thumbnail me-3" style={{width: 60, height: 60, objectFit: 'cover'}}/>
                                            <div>
                                                <div>{item.produto_nome}</div>
                                                <small className="text-muted">{formatCurrency(item.preco_unitario)}</small>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <div className="input-group input-group-sm me-3" style={{width: 110}}>
                                                <button className="btn btn-outline-secondary" onClick={() => handleUpdateQuantity(item.id, item.quantidade - 1)}>-</button>
                                                <span className="form-control text-center">{item.quantidade}</span>
                                                <button className="btn btn-outline-secondary" onClick={() => handleUpdateQuantity(item.id, item.quantidade + 1)}>+</button>
                                            </div>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveItem(item.id)}>&times;</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <h4 className="text-end">Total: {formatCurrency(valorTotal)}</h4>
                        </>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ComandaDetailsModal;