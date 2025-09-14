// src/components/AddEmployeeModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import Select from 'react-select';

function AddEmployeeModal({ show, onHide, onSave }) {
    const [formData, setFormData] = useState({ nome: '', email: '', senha: '', funcao_id: null });
    const [funcoes, setFuncoes] = useState([]);
    const modalRef = useRef();
    
    useEffect(() => {
        const fetchFuncoes = async () => {
            const response = await api.get('/api/funcoes');
            setFuncoes(response.data.map(f => ({ value: f.id, label: f.nome_funcao })));
        };
        if(show) fetchFuncoes();
    }, [show]);

    useEffect(() => {
        const modalElement = modalRef.current;
        const bsModal = Modal.getOrCreateInstance(modalElement);
        if (show) bsModal.show(); else bsModal.hide();
    }, [show]);

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
    const handleFuncaoChange = (selected) => setFormData({...formData, funcao_id: selected ? selected.value : null});

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/funcionarios', formData);
            alert("Funcionário criado com sucesso!");
            onSave();
        } catch (err) { alert(err.response?.data?.message || "Erro ao criar funcionário."); }
    };

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog">
                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="modal-header"><h5 className="modal-title">Adicionar Novo Funcionário</h5><button type="button" className="btn-close" onClick={onHide}></button></div>
                        <div className="modal-body">
                            <div className="mb-3"><label>Nome Completo</label><input type="text" name="nome" className="form-control" onChange={handleChange} required /></div>
                            <div className="mb-3"><label>Email (para login)</label><input type="email" name="email" className="form-control" onChange={handleChange} required /></div>
                            <div className="mb-3"><label>Senha Inicial</label><input type="password" name="senha" className="form-control" onChange={handleChange} required /></div>
                            <div className="mb-3"><label>Função</label><Select options={funcoes} onChange={handleFuncaoChange} placeholder="Selecione a função..." required /></div>
                        </div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button><button type="submit" className="btn btn-primary">Salvar</button></div>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default AddEmployeeModal;