// src/components/ManageRolesModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';

function ManageRolesModal({ show, onHide, onSave }) {
    const [funcoes, setFuncoes] = useState([]);
    const [permissoes, setPermissoes] = useState([]);
    const [novaFuncao, setNovaFuncao] = useState('');
    const [loading, setLoading] = useState(false);
    const modalRef = useRef();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [funcoesRes, permissoesRes] = await Promise.all([
                api.get('/api/funcoes'),
                api.get('/api/funcoes/permissoes')
            ]);
            setFuncoes(funcoesRes.data);
            setPermissoes(permissoesRes.data);
        } catch (err) { console.error("Erro ao buscar dados", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (show) fetchData(); }, [show]);
    useEffect(() => {
        const modalElement = modalRef.current;
        const bsModal = Modal.getOrCreateInstance(modalElement);
        if (show) bsModal.show(); else bsModal.hide();
    }, [show]);

    const handleAddFuncao = async (e) => {
        e.preventDefault();
        await api.post('/api/funcoes', { nome_funcao: novaFuncao });
        setNovaFuncao('');
        fetchData();
    };

    const handlePermissionChange = async (funcaoId, permissaoChave) => {
        const funcao = funcoes.find(f => f.id === funcaoId);
        let novasPermissoes;
        if (funcao.permissoes.includes(permissaoChave)) {
            novasPermissoes = funcao.permissoes.filter(p => p !== permissaoChave);
        } else {
            novasPermissoes = [...funcao.permissoes, permissaoChave];
        }
        await api.put(`/api/funcoes/${funcaoId}/permissoes`, { permissoes: novasPermissoes });
        fetchData();
        onSave(); // Avisa a página principal para recarregar os dados
    };
    
    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header"><h5 className="modal-title">Gerenciar Funções e Permissões</h5><button type="button" className="btn-close" onClick={onHide}></button></div>
                    <div className="modal-body">
                        <h6>Adicionar Nova Função</h6>
                        <form onSubmit={handleAddFuncao} className="d-flex mb-4">
                            <input type="text" className="form-control me-2" value={novaFuncao} onChange={e => setNovaFuncao(e.target.value)} placeholder="Nome da Função (ex: Garçom)" required/>
                            <button type="submit" className="btn btn-primary">Adicionar</button>
                        </form>
                        <hr />
                        <h6>Permissões por Função</h6>
                        {loading ? <div className="spinner-border spinner-border-sm"/> : funcoes.map(funcao => (
                            <div key={funcao.id} className="mb-3">
                                <strong>{funcao.nome_funcao}</strong>
                                <div className="d-flex flex-wrap mt-2">
                                    {permissoes.map(permissao => (
                                        <div key={permissao.id} className="form-check form-switch me-3">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id={`check-${funcao.id}-${permissao.id}`}
                                                checked={funcao.permissoes.includes(permissao.chave_permissao)}
                                                onChange={() => handlePermissionChange(funcao.id, permissao.chave_permissao)}
                                            />
                                            <label className="form-check-label" htmlFor={`check-${funcao.id}-${permissao.id}`}>{permissao.descricao}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default ManageRolesModal;