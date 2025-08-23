// src/components/OrderDetailsModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';

function OrderDetailsModal({ show, onHide, pedidoId }) {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef();

  useEffect(() => {
    if (show && pedidoId) {
      const fetchDetalhesPedido = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/api/pedidos/${pedidoId}`);
          setPedido(response.data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
      };
      fetchDetalhesPedido();
    }
  }, [show, pedidoId]);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);
  
  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Detalhes do Pedido #{pedidoId}</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {loading && <div className="text-center"><div className="spinner-border" /></div>}
            {pedido && !loading && (
              <div>
                <p><strong>Data:</strong> {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</p>
                <p><strong>Status:</strong> {pedido.status}</p>
                <h6 className="mt-4">Itens do Pedido:</h6>
                <ul className="list-group">
                  {pedido.itens.map((item, index) => (
                    <li key={index} className="list-group-item d-flex align-items-center">
                      <img src={item.imagem_produto_url ? `http://localhost:3001/uploads/${item.imagem_produto_url}` : 'https://placehold.co/60'} alt={item.nome} className="img-thumbnail me-3" style={{ width: '60px' }} />
                      <div className="flex-grow-1">
                        <div>{item.nome}</div>
                        <small className="text-muted">{item.quantidade} x R$ {parseFloat(item.preco_unitario).toFixed(2).replace('.', ',')}</small>
                      </div>
                      <div className="fw-bold">R$ {(item.quantidade * item.preco_unitario).toFixed(2).replace('.', ',')}</div>
                    </li>
                  ))}
                </ul>
                <div className="text-end fw-bold fs-5 mt-3">Total: R$ {parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default OrderDetailsModal;