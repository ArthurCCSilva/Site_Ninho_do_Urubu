// src/components/CriarComandaModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import Select from 'react-select';

const ID_CLIENTE_BALCAO = 11; // ID do seu usuário "Venda Balcão"

function CriarComandaModal({ show, onHide, onSave }) {
    const [tipoCliente, setTipoCliente] = useState('cadastrado');
    const [clientes, setClientes] = useState([]);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [nomeClienteAvulso, setNomeClienteAvulso] = useState('');
    const modalRef = useRef();

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const response = await api.get('/api/usuarios/clientes?limit=1000');
                const options = response.data.clientes.map(c => ({ value: c.id, label: c.nome }));
                setClientes(options);
            } catch (err) {
                console.error("Erro ao buscar clientes", err);
            }
        };

        if (show) {
            fetchClientes();
            setSelectedCliente(null);
            setNomeClienteAvulso('');
        }
    }, [show]);

    useEffect(() => {
        const modalElement = modalRef.current;
        const bsModal = Modal.getOrCreateInstance(modalElement);
        if (show) bsModal.show(); else bsModal.hide();
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        let payload = {};
        if (tipoCliente === 'cadastrado') {
            if (!selectedCliente) return alert("Por favor, selecione um cliente.");
            payload = { usuario_id: selectedCliente.value };
        } else {
            if (!nomeClienteAvulso.trim()) return alert("Por favor, insira o nome do cliente.");
            payload = { usuario_id: ID_CLIENTE_BALCAO, nome_cliente_avulso: nomeClienteAvulso };
        }

        try {
            await api.post('/api/comandas', payload);
            alert("Comanda aberta com sucesso!");
            onSave();
        } catch (err) {
            alert("Erro ao abrir comanda.");
        }
    };

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog">
                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Abrir Nova Comanda</h5>
                            <button type="button" className="btn-close" onClick={onHide}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" name="tipoCliente" id="clienteCadastrado" value="cadastrado" checked={tipoCliente === 'cadastrado'} onChange={e => setTipoCliente(e.target.value)} />
                                    <label className="form-check-label" htmlFor="clienteCadastrado">Cliente Cadastrado</label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" name="tipoCliente" id="clienteVulso" value="avulso" checked={tipoCliente === 'avulso'} onChange={e => setTipoCliente(e.target.value)} />
                                    <label className="form-check-label" htmlFor="clienteVulso">Cliente de Balcão</label>
                                </div>
                            </div>

                            {tipoCliente === 'cadastrado' ? (
                                <div className="mb-3">
                                    <label className="form-label">Selecionar Cliente</label>
                                    <Select options={clientes} isClearable placeholder="Pesquisar cliente..." value={selectedCliente} onChange={setSelectedCliente} />
                                </div>
                            ) : (
                                <div className="mb-3">
                                    <label className="form-label">Nome do Cliente</label>
                                    <input type="text" className="form-control" value={nomeClienteAvulso} onChange={e => setNomeClienteAvulso(e.target.value)} placeholder="Nome para identificação" required />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Abrir Comanda</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CriarComandaModal;