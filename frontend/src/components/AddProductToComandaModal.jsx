// src/components/AddProductToComandaModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import Select from 'react-select';

function AddProductToComandaModal({ show, onHide, onSave, comanda }) {
    const [produtosOptions, setProdutosOptions] = useState([]);
    const [selectedProduto, setSelectedProduto] = useState(null); // Agora guarda o objeto completo do produto
    const [quantidade, setQuantidade] = useState(1);
    const modalRef = useRef();

    useEffect(() => {
        const fetchProdutos = async () => {
            try {
                const response = await api.get('/api/produtos?limit=1000&active=true');
                // A opção agora guarda o objeto completo do produto no 'value'
                const options = response.data.produtos.map(p => ({
                    value: p, // Guarda o objeto inteiro do produto
                    label: `${p.nome} (R$ ${parseFloat(p.valor).toFixed(2).replace('.', ',')})`
                }));
                setProdutosOptions(options);
            } catch (err) { 
                console.error("Erro ao buscar produtos", err); 
            }
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
        
        // Acessamos o ID do produto dentro do objeto selectedProduto
        try {
            await api.post('/api/comandas/item', {
                comanda_id: comanda.id,
                produto_id: selectedProduto.id, // ID está no objeto selectedProduto
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
                                {/* O onChange agora guarda o objeto inteiro do produto selecionado */}
                                <Select 
                                    options={produtosOptions} 
                                    // Ajuste para o valor exibido no Select
                                    value={selectedProduto ? { value: selectedProduto, label: `${selectedProduto.nome} (R$ ${parseFloat(selectedProduto.valor).toFixed(2).replace('.', ',')})` } : null}
                                    onChange={(option) => setSelectedProduto(option ? option.value : null)} 
                                    placeholder="Selecione um produto..." 
                                    required 
                                />
                            </div>

                            {/* CARD DE PRÉ-VISUALIZAÇÃO */}
                            {selectedProduto && (
                                <div className="card bg-light mb-3">
                                    <div className="card-body d-flex align-items-center p-2">
                                        <img 
                                            src={selectedProduto.imagem_produto_url ? `http://localhost:3001/uploads/${selectedProduto.imagem_produto_url}` : 'https://placehold.co/60'} 
                                            alt={selectedProduto.nome} 
                                            className="img-thumbnail me-3" 
                                            style={{width: '60px', height: '60px', objectFit: 'cover'}}
                                        />
                                        <div>
                                            <h6 className="mb-0">{selectedProduto.nome}</h6>
                                            <p className="mb-0 text-success fw-bold">{parseFloat(selectedProduto.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

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