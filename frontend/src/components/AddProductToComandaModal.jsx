// src/components/AddProductToComandaModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import Select from 'react-select';

function AddProductToComandaModal({ show, onHide, onSave, comanda }) {
    const [produtos, setProdutos] = useState([]);
    const [selectedProduto, setSelectedProduto] = useState(null);
    const [quantidade, setQuantidade] = useState(1);
    const modalRef = useRef();

    useEffect(() => {
        const fetchProdutos = async () => {
            try {
                const response = await api.get('/api/produtos?limit=1000&active=true');
                const options = response.data.produtos.map(p => ({ value: p.id, label: p.nome }));
                setProdutos(options);
            } catch (err) { console.error("Erro ao buscar produtos", err); }
        };

        if (show) {
            fetchProdutos();
            setSelectedProduto(null);
            setQuantidade(1);
        }
    }, [show]);
    
    useEffect(() => {
        const modalElement = modalRef.current;
        const bsModal = Modal.getOrCreateInstance(modalElement);
        if (show) bsModal.show(); else bsModal.hide();
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduto || quantidade < 1) {
            return alert("Selecione um produto e uma quantidade válida.");
        }
        try {
            await api.post('/api/comandas/item', {
                comanda_id: comanda.id,
                produto_id: selectedProduto.value,
                quantidade: quantidade
            });
            alert("Item adicionado com sucesso!");
            onSave();
        } catch (err) {
            alert(err.response?.data?.message || "Erro ao adicionar item.");
        }
    };

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog">
                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Adicionar Produto à Comanda #{comanda?.id}</h5>
                            <button type="button" className="btn-close" onClick={onHide}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Produto</label>
                                <Select options={produtos} value={selectedProduto} onChange={setSelectedProduto} placeholder="Selecione um produto..." required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Quantidade</label>
                                <input type="number" className="form-control" value={quantidade} onChange={e => setQuantidade(e.target.value)} min="1" required />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Adicionar</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default AddProductToComandaModal;