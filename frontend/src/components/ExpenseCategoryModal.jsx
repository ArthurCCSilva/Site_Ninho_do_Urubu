// src/components/ExpenseCategoryModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';

function ExpenseCategoryModal({ show, onHide, onUpdate }) {
    const [categorias, setCategorias] = useState([]);
    const [nome, setNome] = useState('');
    const [error, setError] = useState('');
    const modalRef = useRef();

    const fetchCategorias = async () => {
        try {
            const response = await api.get('/api/despesa-categorias');
            setCategorias(response.data);
        } catch (err) {
            console.error("Erro ao buscar categorias de despesa", err);
            setError("Não foi possível carregar as categorias.");
        }
    };

    // Busca as categorias sempre que o modal for aberto
    useEffect(() => {
        if (show) {
            fetchCategorias();
        }
    }, [show]);

    // Controla a exibição do modal do Bootstrap
    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;
        const bsModal = Modal.getOrCreateInstance(modalElement);

        if (show) {
            bsModal.show();
        } else {
            bsModal.hide();
        }
    }, [show]);

    // Função para adicionar uma nova categoria
    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');
        if (!nome.trim()) {
            return setError("O nome da categoria não pode estar vazio.");
        }
        try {
            await api.post('/api/despesa-categorias', { nome });
            setNome('');      // Limpa o campo de input
            fetchCategorias(); // Atualiza a lista de categorias
            if (onUpdate) onUpdate(); // Avisa a página principal para recarregar dados
        } catch (err) {
            setError(err.response?.data?.message || "Erro ao adicionar categoria.");
        }
    };

    // Função para deletar uma categoria
    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza? Se esta categoria estiver em uso, não será possível excluí-la.')) {
            try {
                await api.delete(`/api/despesa-categorias/${id}`);
                fetchCategorias(); // Atualiza a lista
                if (onUpdate) onUpdate(); // Avisa a página principal para recarregar dados
            } catch (err) {
                alert(err.response?.data?.message || "Erro ao excluir categoria.");
            }
        }
    };

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Gerenciar Categorias de Despesa</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        
                        <h6 className="mb-3">Adicionar Nova Categoria</h6>
                        <form onSubmit={handleAdd} className="d-flex mb-4">
                            <input 
                                type="text" 
                                className="form-control me-2"
                                placeholder="Nome da nova categoria"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary">Adicionar</button>
                        </form>

                        <hr />
                        <h6 className="mb-3">Categorias Existentes</h6>
                        <ul className="list-group">
                            {categorias.map(cat => (
                                <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <span>{cat.nome}</span>
                                    
                                    {/* ✅ CORREÇÃO AQUI */}
                                    {cat.nome === 'Perda de Inventário' ? (
                                        <button className="btn btn-danger btn-sm" disabled title="Esta categoria é protegida pelo sistema.">
                                            Excluir
                                        </button>
                                    ) : (
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat.id)}>
                                            Excluir
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExpenseCategoryModal;