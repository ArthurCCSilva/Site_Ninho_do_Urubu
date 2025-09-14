// src/components/AdminActionModal.jsx
import { useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import { useFeatureFlags } from '../context/FeatureFlagContext';

// ✅ 1. RECEBA a nova prop 'onShowDetails'
function AdminActionModal({ show, onHide, pedido, onUpdateStatus, onShowCancelModal, onShowDetails }) {
  const modalRef = useRef();
  const { isEnabled } = useFeatureFlags();

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  if (!pedido) return null;

  // Funções de clique agora primeiro fecham este modal e depois executam a ação
  const handleUpdateClick = (status) => {
    onUpdateStatus(pedido.id, status);
    onHide();
  };

  const handleCancelClick = () => {
    onShowCancelModal(pedido.id);
    onHide();
  };

  // ✅ 2. NOVA FUNÇÃO para lidar com o clique em "Ver Detalhes"
  const handleDetailsClick = () => {
    onShowDetails(pedido.id);
    onHide(); // Fecha o modal de ações para então abrir o de detalhes
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Ações para o Pedido #{pedido.id}</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <p>Selecione uma ação para o pedido de <strong>{pedido.cliente_nome}</strong>.</p>
            <div className="d-grid gap-2">
              {/* ✅ 3. NOVO BOTÃO adicionado */}
              <button className="btn btn-outline-primary" onClick={handleDetailsClick}>
                Ver Detalhes do Pedido
              </button>
              <hr/>
              <button className="btn btn-outline-warning" onClick={() => handleUpdateClick('Processando')}>
                Marcar como "Processando"
              </button>
              <button className="btn btn-outline-info" onClick={() => handleUpdateClick('Enviado')}>
                Marcar como "Enviado"
              </button>
              <button className="btn btn-outline-success" onClick={() => handleUpdateClick('Entregue')}>
                Marcar como "Entregue"
              </button>
              <hr />
              <button className="btn btn-danger" onClick={handleCancelClick}>
                Cancelar Pedido (Admin)
              </button>
              {isEnabled('sistema_fiado') && <button className="btn btn-outline-dark" onClick={() => handleUpdateClick('Fiado')}>Marcar como "Fiado"</button>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminActionModal;