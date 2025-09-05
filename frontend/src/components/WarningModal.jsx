// src/components/WarningModal.jsx
import { useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';

function WarningModal({ show, onHide, title, children }) {
  const modalRef = useRef();

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

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1" data-bs-backdrop="static">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarningModal;