// src/components/FecharComandaModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import { useAuth } from '../context/AuthContext'; // ✅ 1. Importa o useAuth

function FecharComandaModal({ show, onHide, comanda, onSave }) {
    const { isEnabled } = useFeatureFlags();
    const { user } = useAuth(); // ✅ 2. Pega o usuário logado
    const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
    const [valorPago, setValorPago] = useState('');
    const modalRef = useRef();

    useEffect(() => {
        const modalElement = modalRef.current;
        const bsModal = Modal.getOrCreateInstance(modalElement);
        if (show) {
            setFormaPagamento('Dinheiro');
            setValorPago('');
            bsModal.show();
        } else {
            bsModal.hide();
        }
    }, [show]);

    const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const handleSave = async () => {
        try {
            await api.post(`/api/comandas/${comanda.id}/fechar`, {
                forma_pagamento: formaPagamento,
                valor_pago_cliente: formaPagamento === 'Dinheiro' ? valorPago : null
            });
            alert("Comanda fechada e pedido gerado com sucesso!");
            onSave();
        } catch (error) {
            alert(error.response?.data?.message || "Erro ao fechar comanda.");
        }
    };

    const troco = valorPago > (comanda?.valor_total || 0) ? valorPago - comanda.valor_total : 0;

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Fechar Comanda #{comanda?.id}</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        <p><strong>Cliente:</strong> {comanda?.cliente_nome} {comanda?.nome_cliente_avulso ? `(${comanda.nome_cliente_avulso})` : ''}</p>
                        <h4 className="text-center">Total a Pagar: {formatCurrency(comanda?.valor_total)}</h4>
                        <hr/>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Forma de Pagamento</label>
                            <select className="form-select" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="PIX">PIX</option>
                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                                <option value="Cartão de Débito">Cartão de Débito</option>
                                
                                {/* ✅ 3. VERIFICAÇÃO DUPLA: Feature está ligada E o usuário tem a permissão */}
                                {isEnabled('sistema_fiado') && user?.permissoes?.includes('sistema_fiado') && 
                                    <option value="Fiado">Fiado (Registrar Dívida)</option>}
                            </select>
                        </div>
                        {formaPagamento === 'Dinheiro' && (
                            <div className="mb-3">
                                <label className="form-label">Valor Pago pelo Cliente (para troco)</label>
                                <input type="number" className="form-control" value={valorPago} onChange={e => setValorPago(e.target.value)} placeholder="Ex: 50.00" />
                                {troco > 0 && <div className="form-text text-success fw-bold">Troco: {formatCurrency(troco)}</div>}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button>
                        <button type="button" className="btn btn-success" onClick={handleSave}>Confirmar Pagamento</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FecharComandaModal;