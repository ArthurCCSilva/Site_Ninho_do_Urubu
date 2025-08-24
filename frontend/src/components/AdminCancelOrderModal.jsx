// src/components/AdminCancelOrderModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';

function AdminCancelOrderModal({ show, onHide, onConfirm }) {
    const [motivo, setMotivo] = useState('');
    const modalRef = useRef();

    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;
        const bsModal = Modal.getOrCreateInstance(modalElement);
        if (show) bsModal.show();
        else bsModal.hide();
    }, [show]);

    const handleConfirm = () => {
        if (!motivo.trim()) {
            alert('Por favor, informe o motivo do cancelamento.');
            return;
        }
        onConfirm(motivo);
        setMotivo(''); // Limpa o campo após confirmar
    };

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Cancelar Pedido</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        <p>Por favor, informe o motivo do cancelamento para notificar o cliente.</p>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Ex: Item fora de estoque."
                        ></textarea>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>Voltar</button>
                        <button type="button" className="btn btn-danger" onClick={handleConfirm}>Confirmar Cancelamento</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminCancelOrderModal;